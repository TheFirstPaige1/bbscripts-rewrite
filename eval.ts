import { NS } from "@ns";
export async function main(ns: NS): Promise<void> {
	ns.singularity.getCrimeStats;
	ns.corporation.purchaseUnlock;
	ns.tprint(eval(ns.args[0] as string));
}