import { NS } from "@ns";
import { thereCanBeOnlyOne } from "./bitlib";
export async function main(ns: NS): Promise<void> {
	thereCanBeOnlyOne(ns);
	while (false) {
		let frags = ns.stanek.activeFragments().filter(frag => frag.id < 100);
	}
}