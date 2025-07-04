import { NS } from "@ns";
import { bitnodeAccess } from "./bitlib";
export async function main(ns: NS): Promise<void> {
	const tradecost = ns.stock.getConstants().StockMarketCommission;
	ns.scriptKill("stockwatcher.js", "home");
	if (ns.stock.hasWSEAccount() && ns.stock.hasTIXAPIAccess()) {
		const stocknames = ns.stock.getSymbols();
		for (const stocksym of stocknames) {
			while (ns.getServerMoneyAvailable("home") < tradecost) { await ns.sleep(10000); }
			ns.stock.sellStock(stocksym, ns.stock.getPosition(stocksym)[0]);
			if (bitnodeAccess(ns, 8, 2)) {
				while (ns.getServerMoneyAvailable("home") < tradecost) { await ns.sleep(10000); }
				ns.stock.sellShort(stocksym, ns.stock.getPosition(stocksym)[2]);
			}
		}
	}
}