import { NS } from "@ns";
import { bitnodeAccess, wrapNS } from "./bitlib";
export async function main(ns: NS): Promise<void> {
	if (!ns.fileExists("todolist.txt", "home")) {
		const wns = wrapNS(ns);
		let todolist = [] as string[];
	} //ns.write("todolist.txt", JSON.stringify(sortedfiles));
	else {
		ns.tprint("todolist.txt already exists! kill all scripts and delete the file to try again.")
	}
}