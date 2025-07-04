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
 * A hardcoded list of most of the normal factions in the game, ordered in a rough descending list of work priority. 
 */
export const desiredfactions = [
	"Netburners",
	"Tian Di Hui",
	"Aevum",
	"CyberSec",
	"Chongqing",
	"New Tokyo",
	"Ishima",
	"Sector-12",
	"NiteSec",
	"Tetrads",
	"Bachman & Associates",
	"BitRunners",
	"ECorp",
	"Daedalus",
	"Fulcrum Secret Technologies",
	"The Black Hand",
	"The Dark Army",
	"Clarke Incorporated",
	"OmniTek Incorporated",
	"NWO",
	"Blade Industries",
	"The Covenant",
	"Illuminati",
	"Slum Snakes",
	"Volhaven",
	"Speakers for the Dead",
	"The Syndicate",
	"MegaCorp",
	"KuaiGong International",
	"Silhouette"
];

/**
 * A list of names for naming gang members with. 
 */
export const gangNames = [
	"Jerry",
	"George",
	"Elaine",
	"Kramer",
	"Konata",
	"Kagami",
	"Miyuki",
	"Tsukasa",
	"Finn",
	"Jake",
	"Bonnibel",
	"Marcilene"
];

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
 * Returns how much RAM a server will always leave free. This handles weird cases, like hacknet servers. 
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

/**
 * Formats a given duration in milliseconds into something more useful to the user. Used for react tables.
 * @param ns BitBurner NS object
 * @param milliseconds duration in milliseconds as a number
 * @returns the duration formatted in human-readable text as a string
 */
export function formatTimeString(ns: NS, milliseconds: number): string {
	return ns.tFormat(milliseconds, false).replace(/ days?/, 'd').replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/,
		's').replaceAll(', ', '') + " " + Math.floor(milliseconds % 1000).toString().padStart(3, '0') + 'ms';
}

/**
 * Formats a percentage as a simple progress bar, primarily for use in react tables.
 * Despite the name, this can be used to format any information given as a percent figure.
 * @param percent percent of the bar to be filled, as a number
 * @param length length of the bar, as a number
 * @returns a formatted progress bar, as a string
 */
export function formatLoadingBar(percent: number, length: number): string {
	let finalstring = "";
	let sublength = length - 2;
	let percentlength = Math.floor(sublength * percent);
	while (finalstring.length < percentlength) { finalstring += "|"; }
	while (finalstring.length < sublength) { finalstring += "-"; }
	return "[" + finalstring + "]";
}

/**
 * Returns a boolean on specific SF access, for purposes of detecting if specific mechanics are available.
 * Note that due to getResetInfo().ownedSF respecting BitNode options, this function does also.
 * @param ns BitBurner NS object
 * @param node BitNode number
 * @param level Source File level
 * @returns boolean on if the specified BN/SF content is available
 */
export function bitnodeAccess(ns: NS, node: number, level: number): boolean {
	return (ns.getResetInfo().currentNode == node) || ((ns.getResetInfo().ownedSF.get(node) || 0) >= level);
}

/**
 * Creates an array detailing the server network, in the form of string pairs. 
 * The first of a pair is the name of a server, the second is the name of the server that is one step closer to home.
 * @param ns BitBurner NS object
 * @returns an array containing server name string pair arrays
 */
export function netScan(ns: NS): string[][] {
	let currentserver = "home";
	let scanservers = ["home"];
	let knownservers = [] as string[];
	let servermap = [["home", "home"]];
	while (scanservers.length > 0) {
		currentserver = scanservers[0];
		knownservers.push(currentserver);
		for (const scantarg of ns.scan(currentserver)) {
			if (!scanservers.includes(scantarg) && !knownservers.includes(scantarg)) {
				scanservers.push(scantarg);
				servermap.push([scantarg, currentserver]);
			}
		}
		scanservers = scanservers.slice(1);
	}
	return servermap;
}

/**
 * Attempts to connect to a given server by daisy-chaining between it and home.
 * @param ns BitBurner NS object
 * @param target string of the server to connect to
 */
export function remoteConnect(ns: NS, target: string): void {
	const networkmap = netScan(ns);
	let next = target;
	let netpath = [target];
	for (let i = networkmap.length - 1; i > 0; i--) {
		if (networkmap[i][0] == next) {
			next = networkmap[i][1];
			netpath.unshift(networkmap[i][1]);
		}
	}
	for (const next of netpath) { ns.singularity.connect(next); }
}

/**
 * 
 * @param ns BitBurner NS object
 * @param target targeted server to backdoor, given as a string
 * @param wait boolean that sets if the function will wait until the backdoor subscript finishes
 */
export async function openTheDoor(ns: NS, target: string, wait: boolean): Promise<void> {
	if (access(ns, target) && (ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target)) && !ns.getServer(target).backdoorInstalled) {
		let ramserver = getDynamicRAM(ns, masterLister(ns).filter(serv => (ns.hasRootAccess(serv) && (ns.getServerMaxRam(serv) > 0)))).name;
		ns.scp("knocker.js", ramserver, "home");
		remoteConnect(ns, target);
		let pid = ns.exec("knocker.js", ramserver, {threads: 1, temporary: true});
		await ns.sleep(1);
		ns.singularity.connect("home");
		if (wait) { while (ns.isRunning(pid)) { await ns.sleep(1000); } }
	}
}

/**
 * 
 * @param ns 
 * @returns 
 */
export async function augLister(ns: NS): Promise<string[]> {
	let auglist = [] as string[];
	for (const faction of desiredfactions) {
		const factaugs = await wrapNS(ns).singularity.getAugmentationsFromFactionD(faction);
		for (const targaug of factaugs) { if (!auglist.includes(targaug)) { auglist.push(targaug); } }
	}
	if (bitnodeAccess(ns, 6, 1) || bitnodeAccess(ns, 7, 1)) { 
		const factaugs = await wrapNS(ns).singularity.getAugmentationsFromFactionD("Bladeburners");
		for (const targaug of factaugs) { auglist.push(targaug); }
	}
	if (bitnodeAccess(ns, 13, 1)) { 
		const factaugs = await wrapNS(ns).singularity.getAugmentationsFromFactionD("Church of the Machine God");
		for (const targaug of factaugs) { auglist.push(targaug); }
	}
	return auglist.sort((a, b) => { return ns.singularity.getAugmentationRepReq(a) - ns.singularity.getAugmentationRepReq(b); });
}
