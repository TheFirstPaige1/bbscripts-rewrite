import ReactLib from 'react';
declare const React: typeof ReactLib;
import {
	Bladeburner, CodingContract, Corporation, Gang, Grafting, NS, ReactElement,
	Singularity, Sleeve, Stanek, TIX, Go
} from "@ns";

// every possible function type is a subtype of this
type AnyFn = (...args: any) => any;

// if F is the type of some function, Asynced<F> is a function that is exactly the same except it returns a Promise<whatever F returns>
type Asynced<F extends AnyFn> = (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>>;

type DispatchMethods<Namespace> = {
	[Method in string & keyof Namespace as `${Method}D`]: Namespace[Method] extends AnyFn ? Asynced<Namespace[Method]> : never;
};

type Proxied<T> = T & DispatchMethods<T>;

// additional things for NS specifically: all of the sub-namespaces can be proxied too
export interface ProxyNS extends Proxied<NS> {
	readonly bladeburner: Proxied<Bladeburner>;
	readonly codingcontract: Proxied<CodingContract>;
	readonly corporation: Proxied<Corporation>;
	readonly gang: Proxied<Gang>;
	readonly grafting: Proxied<Grafting>;
	readonly singularity: Proxied<Singularity>;
	readonly sleeve: Proxied<Sleeve>;
	readonly stock: Proxied<TIX>;
	readonly stanek: Proxied<Stanek>;
	readonly go: Proxied<Go>;
}

/**
 * Creates a subscript on the largest free accessable server and passes it a function to run, waiting if there's not enough memory.
 * @param ns BitBurner NS object
 * @param fn function being called as a string
 * @param args any arguments the function is being passed
 * @returns the function's return value
 */
async function callInSubprocess(ns: NS, fn: string, args: any[]): Promise<any> {
	const id = 0;
	const reply = ns.pid;
	const ramhost = getDynamicRAM(ns, masterLister(ns));
	const ramcost = 1.6 + ns.getFunctionRamCost(fn);
	ns.scp('pawn.js', ramhost.name, "home");
	while (ramhost.freeRam < ramcost) {
		await ns.sleep(1);
	}
	ns.exec(
		'pawn.js',
		ramhost.name,
		{ ramOverride: ramcost, temporary: true },
		reply, id, fn, ...args.map(arg => JSON.stringify(arg))
	);
	let data = ns.readPort(reply);
	while (data == "NULL PORT DATA") {
		await ns.sleep(1);
		data = ns.readPort(reply);
	}
	return JSON.parse(data.toString()).result;
}


function makeSubproxy(ns: NS, somename: string | symbol, realvalue: any): any {
	const wrappedNS = new Proxy(realvalue, {
		get(subns, property) {
			const realvalue = (subns as any)[property];
			if (typeof realvalue === 'object' && !Array.isArray(realvalue)) {
				return makeSubproxy(ns, property, realvalue);
			} else if (realvalue !== undefined) {
				return realvalue;
			}
			if (realvalue !== undefined) return realvalue;
			if (typeof property !== 'string') return undefined;
			if (!property.endsWith('D')) return undefined;
			const realFunction = property.slice(0, -1);
			if (typeof (subns as any)[realFunction] !== "function") return undefined;
			const proxiedFunc = async (...args: any[]) => {
				const result = callInSubprocess(ns, somename as string + "." + realFunction, args);
				return result;
			};
			return proxiedFunc;
		}
	});
	return wrappedNS as any;
}

/**
 * Wraps a ns function or subspaces in a wrapper that allows functions to be called via subscripts. 
 * A function name appended with D will cause that function to behave this way.
 * Functions called through subscripts have to be awaited, even if they otherwise don't.
 * @param ns BitBurner NS object
 * @returns wrapped NS object
 */
export function wrapNS(ns: NS): ProxyNS {
	const wrappedNS = new Proxy(ns, {
		get(ns, property) {
			const realvalue = (ns as any)[property];
			if (typeof realvalue === 'object' && !Array.isArray(realvalue)) {
				return makeSubproxy(ns, property, realvalue);
			} else if (realvalue !== undefined) {
				return realvalue;
			}
			if (realvalue !== undefined) return realvalue;
			if (typeof property !== 'string') return undefined;
			if (!property.endsWith('D')) return undefined;
			const realFunction = property.slice(0, -1);
			if (typeof (ns as any)[realFunction] !== "function") return undefined;
			const proxiedFunc = async (...args: any[]) => {
				const result = callInSubprocess(ns, realFunction, args);
				return result;
			};
			return proxiedFunc;
		}
	});
	return wrappedNS as any;
}

/**
 * Attempts to open every port and gain access to the server, returning a boolean of access
 * @param ns BitBurner NS object
 * @param target the target server as a string
 * @returns root access as a boolean
 */
export function access(ns: NS, target: string): boolean {
	for (const fn of [ns.brutessh, ns.ftpcrack, ns.relaysmtp, ns.httpworm, ns.sqlinject, ns.nuke]) try { fn(target) } catch { }
	return (ns.hasRootAccess(target));
}


/**
 * Creates an array of strings of names of all the servers with current or possible root access.
 * @param ns BitBurner NS object
 * @returns an array of all root-accessable server name strings
 */
export function masterLister(ns: NS): string[] {
	let masterlist = ["home"];
	for (const scantarg of masterlist) {
		let workinglist = ns.scan(scantarg);
		for (const target of workinglist) {
			if (!masterlist.includes(target)) {
				if (access(ns, target)) { masterlist.push(target); }
			}
		}
	}
	return masterlist;
}

/**
 * 
 * @param ns BitBurner NS object
 * @param server 
 * @returns 
 */
export function getServerReservation(ns: NS, server: string): number {
	if (server === 'home') {
		return Math.max(Math.trunc(ns.getServerMaxRam(server) / 4), 128)
	} else if (server.includes("hacknet")) {
		return Math.trunc(ns.getServerMaxRam(server) / 2)
	} else {
		return 0
	}
}

/**
 * Returns the name and free RAM count of the server with the most free RAM out of a given array of servers.
 * @param ns BitBurner NS object
 * @param servers 
 * @returns 
 */
export function getDynamicRAM(ns: NS, servers: string[]): { name: string, freeRam: number } {
	let ramlist = servers.map(name => ({
		name,
		freeRam: ns.getServerMaxRam(name) - ns.getServerUsedRam(name) - getServerReservation(ns, name)
	}));
	return ramlist.reduce((highestRam, currentRam) => currentRam.freeRam > highestRam.freeRam ? currentRam : highestRam);
}

/**
 * Enforces that a script that calls this is the only instance of itself. This is useful for manager scripts.
 * @param ns BitBurner NS object
 */
export function thereCanBeOnlyOne(ns: NS): void {
	for (const process of ns.ps()) { if (process.pid != ns.pid && process.filename == ns.getScriptName()) { ns.kill(process.pid); } }
}

/**
 * Formats a React table with the given data and header keys.
 * @param ns BitBurner NS object
 * @param headerKey 
 * @param tableData 
 * @returns 
 */
export function howTheTurnsTable(ns: NS, headerKey: any, tableData: any[]): ReactElement {
	let headerReact = [];
	let headers = Object.keys(headerKey);
	for (const header of headers) { headerReact.push(React.createElement('th', { style: { "padding": "5px", "textDecoration": "underline" } }, header)); }
	let reactTable = [React.createElement('tr', {}, headerReact)];
	for (const row of tableData) {
		let rowdata = [];
		for (let i = 0; i < headers.length; i++) {
			let celldata = row[headers[i]];
			let format = Object.values(headerKey)[i] as string;
			if (format == 'number') {
				rowdata.push(React.createElement('td', { style: { "padding": "5px", "textAlign": "right" } }, ns.formatNumber(celldata)));
			} else if (format == 'integer') {
				rowdata.push(React.createElement('td', { style: { "padding": "5px", "textAlign": "right" } }, ns.formatNumber(celldata, undefined, undefined, true)));
			} else if (format == 'duration') {
				rowdata.push(React.createElement('td', { style: { "padding": "5px", "textAlign": "right" } }, formatTimeString(ns, celldata)));
			} else if (format.includes('progress')) {
				rowdata.push(React.createElement('td', { style: { "padding": "5px", "textAlign": "center" } }, formatLoadingBar(celldata, parseInt(format.split(',')[1]))));
			} else if (i == 0) {
				rowdata.push(React.createElement('td', { style: { "padding": "5px", "textAlign": "right" } }, celldata));
			} else {
				rowdata.push(React.createElement('td', { style: { "padding": "5px", "textAlign": "center" } }, celldata));
			}
		}
		reactTable.push(React.createElement('tr', {}, rowdata));
	}
	return React.createElement('tbody', {}, reactTable);
}

export function formatTimeString(ns: NS, milliseconds: number): string {
	return ns.tFormat(milliseconds, false).replace(/ days?/, 'd').replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/,
		's').replaceAll(', ', '') + " " + Math.floor(milliseconds % 1000).toString().padStart(3, '0') + 'ms';
}

export function formatLoadingBar(percent: number, length: number): string {
	let finalstring = "";
	let sublength = length - 2;
	let percentlength = Math.floor(sublength * percent);
	while (finalstring.length < percentlength) { finalstring += "|"; }
	while (finalstring.length < sublength) { finalstring += "-"; }
	return "[" + finalstring + "]";
}

export function bitnodeAccess(ns: NS, node: number, level: number): boolean {
	return (ns.getResetInfo().currentNode == node) || ((ns.getResetInfo().ownedSF.get(node) || 0) >= level);
}
