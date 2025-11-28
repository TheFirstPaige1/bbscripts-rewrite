import { NS } from "@ns";
import { thereCanBeOnlyOne } from "./bitlib";
export async function main(ns: NS): Promise<void> {
	const gangNames = [
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
	const desiredgangs = [
		"The Black Hand",
		"The Syndicate",
		"Speakers for the Dead",
		"The Dark Army",
		"NiteSec",
		"Tetrads",
		"Slum Snakes"
	];
	thereCanBeOnlyOne(ns);
	for (const gang of desiredgangs) { ns.gang.createGang(gang) }
	//while (!ns.gang.createGang("") && !ns.gang.inGang()) { await ns.sleep(60000); }//rework this to be a bit smarter
	while (ns.gang.inGang()) {
		const hackers = ns.gang.getGangInformation().isHacking;
		if (ns.gang.canRecruitMember()) { for (const member of gangNames) { ns.gang.recruitMember(member); } }
		let ganglist = ns.gang.getMemberNames();
		let ganginfo = ns.gang.getGangInformation();
		for (const member of ganglist) {
			let meminfo = ns.gang.getMemberInformation(member);
			let ascendresult = ns.gang.getAscensionResult(member);
			if (ascendresult != undefined && ascendresult.hack >= 2) {
				ns.gang.ascendMember(member);
				meminfo = ns.gang.getMemberInformation(member);
				ascendresult = ns.gang.getAscensionResult(member);
			}
			let settask = meminfo.task;
			if (ganginfo.wantedPenalty > 1 && ganginfo.wantedLevel > 1) { settask = "Ethical Hacking"; }
			else if (meminfo.hack_asc_mult < 4) { settask = "Train Hacking"; }
			else if (ganginfo.respectForNextRecruit < Infinity) { settask = "Cyberterrorism" }
			else { settask = "Money Laundering"; }
			if (meminfo.task != settask) { ns.gang.setMemberTask(member, settask); }
		}
		await ns.gang.nextUpdate();
	}
}

/*
gang script general flow:

- create gang if it doesn't exist
	- handle dynamically using the first gang qualified for down a list

- every update tick, iterate over the predefined list of gang members and:
	- add one if it's missing and there's enough respect for another
	- ascend the member if the relevant mults are twice their current value
	-	buy everything that costs less than 1/10th of current cash for the member

- check if a gang is a hacking gang or not

- within the same update tick, then iterate over each existing member and:
	- train if stats are low
	- reduce wanted level if it is high
	- gain respect if there's still gang members to earn
	- fit territory warfare in somehow?
	- default to monet earning
*/