import newHolders from "./new-holders.json";

export const treasury = "0xe7b16698ffe31B453F544Ee57063f60e4F94C8d8";

export const holders = Object.keys(newHolders);

export const amounts: number[] = [];
for (const holder of holders) {
    amounts.push((newHolders as any)[holder].length - (holder === "0x8033cEB86c71EbBF575fF7015FcB8F1689d90aC1" ? 1 : 0));
}

holders.push(treasury);
amounts.push(200);

console.log(holders, amounts);
