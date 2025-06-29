import { NS } from "@ns";
export async function main(ns: NS): Promise<void> {
	switch (ns.args[0] as number) {
		case 0:
			await ns.weaken(ns.args[1] as string);
			break;
		case 1:
			await ns.grow(ns.args[1] as string);
			break;
		case 2:
			await ns.hack(ns.args[1] as string);
	}
}