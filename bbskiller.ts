import { NS } from "@ns";
export async function main(ns: NS): Promise<void> {
	let bburn = ns.bladeburner;
	let skillist = bburn.getSkillNames();
	while (bburn.inBladeburner()) {
		let lowestname = skillist[0];
		let lowestcost = bburn.getSkillUpgradeCost(lowestname);
		for (const skill of skillist) {
			if (bburn.getSkillUpgradeCost(skill) < lowestcost) {
				lowestname = skill;
				lowestcost = bburn.getSkillUpgradeCost(skill);
			}
		}
		while (bburn.getSkillPoints() < lowestcost) {
			await ns.sleep(10000);
		}
		bburn.upgradeSkill(lowestname);
	}
}