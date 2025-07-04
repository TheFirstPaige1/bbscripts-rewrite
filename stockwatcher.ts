import { NS } from "@ns";
import { bitnodeAccess, howTheTurnsTable, thereCanBeOnlyOne } from "./bitlib";
export async function main(ns: NS): Promise<void> {
	ns.disableLog('ALL');
	thereCanBeOnlyOne(ns);
	const canshort = bitnodeAccess(ns, 8, 2);
	const tradecost = ns.stock.getConstants().StockMarketCommission;
	if (ns.stock.hasWSEAccount() && ns.stock.hasTIXAPIAccess()) {
		const stocknames = ns.stock.getSymbols();
		for (const stocksym of stocknames) {
			while (ns.getServerMoneyAvailable("home") < tradecost) { await ns.sleep(10000); }
			ns.stock.sellStock(stocksym, ns.stock.getPosition(stocksym)[0]);
			if (canshort) {
				while (ns.getServerMoneyAvailable("home") < tradecost) { await ns.sleep(10000); }
				ns.stock.sellShort(stocksym, ns.stock.getPosition(stocksym)[2]);
			}
		}
	}
	while (!ns.stock.purchaseWseAccount()) { await ns.sleep(60000); }
	while (!ns.stock.purchaseTixApi()) { await ns.sleep(60000); }
	const pricedev = 2;
	const moneybuffer = tradecost * 10;
	const stocknames = ns.stock.getSymbols();
	let stocktracker = [];
	for (const symbol of stocknames) {
		stocktracker.push({
			name: symbol,
			price: 0,
			pricehistory: [] as number[],
			hottrend: 0,
			newtrend: 0,
			longStocks: 0,
			longProfit: 0,
			shortStocks: 0,
			shortProfit: 0,
		});
	}
	let updatecount = 0;
	ns.print("building stock price history for 20 updates");
	while (updatecount < 20) {
		for (const stock of stocktracker) { stock.pricehistory.unshift(ns.stock.getPrice(stock.name)); }
		await ns.stock.nextUpdate();
		updatecount++;
		ns.print("WSE ticked, update " + updatecount + "/20");
	}
	while (true) {
		for (const stock of stocktracker) {
			let spendingmoney = Math.max(((ns.getServerMoneyAvailable("home") - (2 * moneybuffer)) * 0.25), 0);
			stock.price = ns.stock.getPrice(stock.name);
			stock.pricehistory.unshift(stock.price);
			stock.pricehistory.pop();
			let avcalc = [0, 0, 0];
			for (let j = 0; j < 5; j++) { avcalc[0] = avcalc[0] + stock.pricehistory[j]; }
			avcalc[0] = avcalc[0] / 5;
			for (let j = 0; j < 10; j++) { avcalc[1] = avcalc[1] + stock.pricehistory[j]; }
			avcalc[1] = avcalc[1] / 10;
			for (let j = 10; j < 20; j++) { avcalc[2] = avcalc[2] + stock.pricehistory[j]; }
			avcalc[2] = avcalc[2] / 10;
			stock.hottrend = (100 * (avcalc[0] / avcalc[2])) - 100;
			stock.newtrend = (100 * (avcalc[1] / avcalc[2])) - 100;
			stock.longStocks = ns.stock.getPosition(stock.name)[0];
			if (stock.longStocks > 0) { stock.longProfit = ns.stock.getSaleGain(stock.name, stock.longStocks, "Long"); }
			else { stock.longProfit = 0; }
			stock.shortStocks = ns.stock.getPosition(stock.name)[3];
			if (stock.shortStocks > 0) { stock.shortProfit = ns.stock.getSaleGain(stock.name, stock.shortStocks, "Short"); }
			else { stock.shortProfit = 0; }
			if (stock.longStocks == 0 && spendingmoney > moneybuffer) {
				let purchasecount = Math.trunc(spendingmoney / stock.price);
				purchasecount = Math.min(purchasecount, ns.stock.getMaxShares(stock.name));
				if (stock.hottrend > pricedev) { ns.stock.buyStock(stock.name, purchasecount); }
				else if (stock.newtrend > pricedev) { ns.stock.buyStock(stock.name, purchasecount); }
			} else if (stock.longStocks > 0) {
				if (stock.hottrend < (-1 * pricedev)) { ns.stock.sellStock(stock.name, stock.longStocks); }
				else if (stock.newtrend < (-1 * pricedev)) { ns.stock.sellStock(stock.name, stock.longStocks); }
			}
			if (canshort) {
				if (stock.shortStocks == 0 && spendingmoney > moneybuffer) {
					let purchasecount = Math.trunc(spendingmoney / stock.price);
					purchasecount = Math.min(purchasecount, ns.stock.getMaxShares(stock.name));
					if (stock.hottrend < (-1 * pricedev)) { ns.stock.buyShort(stock.name, purchasecount); }
					else if (stock.newtrend < (-1 * pricedev)) { ns.stock.buyShort(stock.name, purchasecount); }
				} else if (stock.shortStocks > 0) {
					if (stock.hottrend > pricedev) { ns.stock.sellShort(stock.name, stock.shortStocks); }
					else if (stock.newtrend > pricedev) { ns.stock.sellShort(stock.name, stock.shortStocks); }
				}
			}
		}
		ns.clearLog();
		ns.printRaw(howTheTurnsTable(ns, {
			name: "string",
			price: "number",
			hottrend: "integer",
			newtrend: "integer",
			longStocks: "number",
			longProfit: "number",
			shortStocks: "number",
			shortProfit: "number"
		}, stocktracker));
		await ns.stock.nextUpdate();
	}
}