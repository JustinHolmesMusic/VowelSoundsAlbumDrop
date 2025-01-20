// @ts-check

import { readContract, fetchEnsName, http, createConfig} from "@wagmi/core";
import {mainnet} from '@wagmi/core/chains';
import { revealerContractAddress } from "./constants.js";
import { revealerContributionABI } from "../abi/revealerContributionABI.js";

import { config as dotenvConfig } from 'dotenv';

const env = process.env.NODE_ENV || 'development';
dotenvConfig({ path: `.env` });

// Use the environment-specific variables
const apiKey = process.env.INFURA_API_KEY;


// TODO: Consolodate all API/url declarations (and indeed, all chain reads) in one place.
const config = createConfig({
    chains: [mainnet],
    transports: {
        [mainnet.id]: http(`https://mainnet.infura.io/v3/${apiKey}`),
    },
})

function getContributionsByAddress(contributionsMetadata) {

    let contributionsByAddress = {}

    let contributors = contributionsMetadata[0]
    let amounts = contributionsMetadata[1]
    let combined = contributionsMetadata[2]
    let datetimes = contributionsMetadata[3]

    for (let i = 0; i < contributors.length; i++) {

        const address = contributors[i]
        if (!(address in contributionsByAddress)) {
            contributionsByAddress[address] = []
        }

        const is_combined = combined[i]
        const amount = Number(amounts[i])
        const contributionMoment = datetimes[i]

        if (is_combined) {
            if (contributionsByAddress[address].length === 0) {
                // This ought to be an impossible situaiton - how did they dcombine with a bid that didn't exist?
                contributionsByAddress[address].push(Number(0))
            }
            contributionsByAddress[address][0] += Number(amount)
        } else {
            contributionsByAddress[address].push(amount)
        }
    }
    return contributionsByAddress;
}

function getTopContributions(contributionsByAddress) {
    let topContributions = []
    for (let address in contributionsByAddress) {
        let contributions = contributionsByAddress[address];
        for (var c = 0; c < contributions.length; c++) {
            topContributions.push([contributions[c], address]);
        }
    }

    function compareContributions(a, b) {
        if (a[0] > b[0]) {
            return -1;
        }
        if (a[0] < b[0]) {
            return 1;
        }
        return 0;
    }

    topContributions.sort(compareContributions);
    return topContributions;
}


export async function getVowelsoundContributions(config) {
    console.time("Revealer-facts")
    const contributionsMetadata = await readContract(config, {
        address: revealerContractAddress,
        abi: revealerContributionABI,
        chainId: 1,
        functionName: 'getAllContributions',
    });

    let contributionsByAddress = getContributionsByAddress(contributionsMetadata)

    // array, sorted by contribution amount, of arrays of [amount, address]
    let leaders = getTopContributions(contributionsByAddress)

    // Loop through the contributors and append a row for each
    for (let i = 0; i < leaders.length; i++) {
        let thisLeader = leaders[i];
        let amountInWei = thisLeader[0];

        let amountInEth = Number(amountInWei) / 10**18;

        leaders[i] = {"amountWei": amountInWei, "amountEth": amountInEth, "address": thisLeader[1], "rank": i};

        let ensName = await fetchEnsName(config, {address: thisLeader[1], chainId: 1});
        if (ensName !== null) {
            leaders[i]["ensName"] = ensName;
        }
    };
    console.timeEnd("Revealer-facts")
    return leaders;
}

export const artifactImageMapping = {
    1: "aaa.png",
    2: "eee.png",
    3: "ce.png",
    4:'ot.png',
    5: 'b.png',
    6: 'horseshoe.png',
    7: 'iii.png',
    8: 'uu.png',
    9: 'vv.png',
    10: 'Y.png',

}