import { NS } from "@ns";

/**
 * Attempts to open every port and gain access to the server, returning a boolean of access
 * @param ns Bitburner NS object
 * @param target the target server as a string
 * @returns root access as a boolean
 */
export function access(ns: NS, target: string): boolean {
	ns.disableLog('brutessh');
	ns.disableLog('ftpcrack');
	ns.disableLog('relaysmtp');
	ns.disableLog('httpworm');
	ns.disableLog('sqlinject');
	ns.disableLog('nuke');
	for (const fn of [ns.brutessh, ns.ftpcrack, ns.relaysmtp, ns.httpworm, ns.sqlinject, ns.nuke]) try { fn(target) } catch { }
	return (ns.hasRootAccess(target));
}

