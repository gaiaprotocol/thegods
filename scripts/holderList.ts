import newHolders from "./new-holders.json";

// TODO: Replace treasury address
export const treasury = "0x1230000000000000000000000000000000000321";

export const holders = Object.keys(newHolders);

export const amounts: number[] = [];
for (const holder of holders) {
    amounts.push((newHolders as any)[holder].length);
}

holders.push(treasury);
amounts.push(200);

//console.log(holders, amounts);