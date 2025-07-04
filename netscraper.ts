import { NS } from "@ns";
import { getDynamicRAM, masterLister, remoteConnect } from "./bitlib";
export async function main(ns: NS): Promise<void> {
	let excludedservers = ns.getPurchasedServers();
	for (let i = 0; i < ns.hacknet.numNodes(); i++) { excludedservers.push(ns.hacknet.getNodeStats(i).name); }
	excludedservers.push("w0r1d_d43m0n");
	excludedservers.push("darkweb");
	let masterlist = masterLister(ns);
	masterlist = masterlist.filter(server => !excludedservers.includes(server));
	let doorcount = [];
	for (const server of masterlist) {
		ns.scp(ns.ls(server, ".lit"), "home", server);
		if (ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel() && !ns.getServer(server).backdoorInstalled) {
			let ramserver = getDynamicRAM(ns, masterlist).name;
			ns.scp("knocker.js", ramserver, "home");
			remoteConnect(ns, server);
			doorcount.push(ns.exec("knocker.js", ramserver, {threads: 1, temporary: true}));
			await ns.sleep(1);
		}
	}
	doorcount = doorcount.filter(door => door != 0);
	let runningcount = 0;
	for (const door of doorcount) { if (ns.isRunning(door)) { runningcount++; } }
	ns.singularity.connect("home");
	ns.tprint("attempting to backdoor " + doorcount.length + " servers...");
	while (runningcount > 0) {
		let oldcount = runningcount;
		ns.tprint(runningcount + " remaining");
		while (oldcount == runningcount) {
			await ns.sleep(500);
			runningcount = 0;
			for (const door of doorcount) { if (ns.isRunning(door)) { runningcount++; } }
		}
	}
	ns.tprint("done!");
}