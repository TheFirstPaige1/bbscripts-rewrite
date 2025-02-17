import { NS } from "@ns";
export async function main(ns: NS): Promise<void> {
	const [reply, id, method, ...json_args] = ns.args as string[];
	const args = json_args.map(arg => JSON.parse(arg));
	const func = method.split('.').reduce((obj, name) => obj[name], ns as any);
	const result = await func(...args)
	const response = JSON.stringify({
		'#id': id,
		'result': result,
	});
	while (!ns.tryWritePort(parseInt(reply), response)) {
		await ns.asleep(1);
	}
}