import { NS } from "@ns";
import { bitnodeAccess, wrapNS } from "./bitlib";
export async function main(ns: NS): Promise<void> {
	if (!ns.fileExists("todolist.txt", "home")) {
		const wns = wrapNS(ns);
		let todolist = [] as string[];
		/*
		ns.stanek.acceptGift();
		const inBladeburners = await wns.bladeburner.joinBladeburnerDivisionD();
		const canPlayerburn = bitnodeAccess(ns, 7, 1);
		const canSleeveburn = bitnodeAccess(ns, 6, 1); //sleeves dont need the full api
		if ((canPlayerburn || canSleeveburn) && (!inBladeburners)) { todolist.push("JOINBLADEBURNERS") }
		const inGang = ns.gang.inGang();
		const canGang = bitnodeAccess(ns, 2, 1);
		const isCorpo = ns.corporation.hasCorporation();
		const canSellout = bitnodeAccess(ns, 3, 3); //honestly not worth trying to automate without the full api
		const canSing = bitnodeAccess(ns, 4, 3); //similar thing here, singularity api aint totally worth using til 3
		const canGraft = bitnodeAccess(ns, 10, 1); //technically also works to check for sleeve access
		*/
	} //ns.write("todolist.txt", JSON.stringify(sortedfiles));
	else {
		ns.tprint("todolist.txt already exists! kill all scripts and delete the file to try again.")
	}
}