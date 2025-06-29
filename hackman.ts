import { NS } from "@ns";
//import { getDynamicRAM, howTheTurnsTable, masterLister, thereCanBeOnlyOne } from "./bitlib";
import { getDynamicRAM, masterLister, thereCanBeOnlyOne } from "./bitlib";
export async function main(ns: NS): Promise<void> {
	ns.disableLog('ALL');
	thereCanBeOnlyOne(ns);
	let formsexe = ns.fileExists("Formulas.exe", "home");
	let masterlist = masterLister(ns);
	for (const target of masterlist) { ns.scriptKill("digger.js", target); }
	let ramlist = masterlist.filter(server => ns.getServerMaxRam(server) > 0);
	for (const target of ramlist) { ns.scp("digger.js", target); }
	let targetList = masterlist.filter(server => (ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel()) && (ns.getServerMaxMoney(server) > 0));
	let hacklist = [];
	for (const target of targetList) {
		hacklist.push({
			name: target,
			money: ns.getServerMoneyAvailable(target),
			mPercent: (ns.getServerMoneyAvailable(target) / ns.getServerMaxMoney(target)),
			security: ns.getServerSecurityLevel(target),
			sPercent: Math.min(1, (ns.getServerSecurityLevel(target) / 100)),
			ramServ: "",
			hackOp: "",
			threads: 0,
			pid: 0,
			timer: 0
		});
	}
	while (true) {
		for (const target of hacklist) {
			if (!ns.isRunning(target.pid)) {
				target.money = ns.getServerMoneyAvailable(target.name);
				target.mPercent = ns.getServerMoneyAvailable(target.name) / ns.getServerMaxMoney(target.name);
				target.security = ns.getServerSecurityLevel(target.name);
				target.sPercent = Math.min(1, (ns.getServerSecurityLevel(target.name) / 100));
				target.ramServ = "";
				target.hackOp = "";
				target.threads = 0;
				let mostfreeram = getDynamicRAM(ns, ramlist);
				let maxthreads = Math.trunc(mostfreeram.freeRam / 2);
				if (maxthreads > 0) {
					target.ramServ = mostfreeram.name;
					if (target.security > (ns.getServerMinSecurityLevel(target.name) + 5)) {
						target.hackOp = "weaken";
						let weakengoal = target.security - ns.getServerMinSecurityLevel(target.name);
						let threadcount = 1;
						while (ns.weakenAnalyze(threadcount, ns.getServer(target.ramServ).cpuCores) < weakengoal) { threadcount++; }
						threadcount = Math.min(threadcount, maxthreads);
						target.threads = threadcount;
						if (formsexe) { target.timer = ns.formulas.hacking.weakenTime(ns.getServer(target.name), ns.getPlayer()); }
						target.pid = ns.exec("digger.js", target.ramServ, threadcount, 0, target.name);
					} else if (target.money < (ns.getServerMaxMoney(target.name) * 0.75)) {
						target.hackOp = "grow";
						let threadcount = 1;
						if (target.money < 10) { threadcount = maxthreads; }
						else {
							if (formsexe) {
								threadcount = ns.formulas.hacking.growThreads(ns.getServer(target.name), ns.getPlayer(), Infinity, ns.getServer(target.ramServ).cpuCores);
							}
							else {
								threadcount = Math.ceil(ns.growthAnalyze(target.name, ns.getServerMaxMoney(target.name) / target.money, ns.getServer(target.ramServ).cpuCores));
							}
							threadcount = Math.min(maxthreads, threadcount);
						}
						target.threads = threadcount;
						if (formsexe) { target.timer = ns.formulas.hacking.growTime(ns.getServer(target.name), ns.getPlayer()); }
						target.pid = ns.exec("digger.js", target.ramServ, threadcount, 1, target.name);
					} else {
						target.hackOp = "hack";
						let threadcount = Math.trunc(ns.hackAnalyzeThreads(target.name, target.money * 0.9));
						threadcount = Math.min(threadcount, maxthreads);
						target.threads = threadcount;
						if (formsexe) { target.timer = ns.formulas.hacking.hackTime(ns.getServer(target.name), ns.getPlayer()); }
						target.pid = ns.exec("digger.js", target.ramServ, threadcount, 2, target.name);
					}
				}
			}
		}
		/*
		ns.clearLog();
		ns.printRaw(howTheTurnsTable(ns, {
			name: "string",
			money: "number",
			mPercent: "progress,20",
			security: "integer",
			sPercent: "progress,20",
			ramServ: "string",
			hackOp: "string",
			threads: "string",
			timer: "duration"
		}, hacklist));
		*/
		if (formsexe) {
			let lowestms = Math.min(...hacklist.map(serv => serv.timer));
			hacklist.forEach(target => { target.timer -= lowestms; });
			await ns.sleep(lowestms);
		} else { while (hacklist.every(server => { ns.isRunning(server.pid); })) { await ns.sleep(500); } }
		let checklist = masterLister(ns);
		if (checklist.length > masterlist.length) { for (const server of checklist) { if (!masterlist.includes(server)) { masterlist.push(server); } } }
		for (const target of masterlist) {
			if ((!ramlist.includes(target)) && (ns.getServerMaxRam(target) > 0)) {
				ramlist.push(target);
				ns.scp("digger.js", target);
			}
			if ((!targetList.includes(target)) && (ns.getServerRequiredHackingLevel(target) <= ns.getHackingLevel()) && (ns.getServerMaxMoney(target) > 0)) {
				targetList.push(target);
				hacklist.push({
					name: target,
					money: ns.getServerMoneyAvailable(target),
					mPercent: (ns.getServerMoneyAvailable(target) / ns.getServerMaxMoney(target)),
					security: ns.getServerSecurityLevel(target),
					sPercent: Math.min(1, (ns.getServerSecurityLevel(target) / 100)),
					ramServ: "",
					hackOp: "",
					threads: 0,
					pid: 0,
					timer: 0
				});
			}
		}
		if (!formsexe) {
			formsexe = ns.fileExists("Formulas.exe", "home");
			if (formsexe) { for (const target of masterlist) { ns.scriptKill("digger.js", target); } }
		}
	}
}