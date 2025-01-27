import readline from 'readline';
import { createHash } from 'crypto';
import { mnemonicToAccount } from 'viem/accounts';
import { ethers } from 'ethers';

import { wordlist } from '@scure/bip39/wordlists/english';


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function diceToIndex(d20, d10_1, d10_2, d10_3) {
    const base = (d20 - 1) * 1000;
    const offset = ((d10_1 - 1) * 100) + ((d10_2 - 1) * 10) + (d10_3 - 1);
    return base + offset;
}

function showInstructions() {
    console.log("\nSeed Phrase Generator - IMPORTANT:");
    console.log("1. Use this on an offline computer");
    console.log("2. Write down each word securely");
    console.log("3. Never share your seed phrase");
    console.log("4. Verify each roll carefully\n");
}

function validateRoll(roll, dice) {
    const num = parseInt(roll);
    if (isNaN(num) || num < 1 || (dice === 'd20' && num > 20) || (dice === 'd10' && num > 10)) {
        throw new Error(`Invalid ${dice} roll: must be 1-${dice === 'd20' ? '20' : '10'}`);
    }
    return num;
}

function verifyEntropySource() {
    console.log("\nIMPORTANT SECURITY CHECKS:");
    console.log("- Are you using fair, physical dice?");
    console.log("- Is this being run on a secure, offline computer?");
    console.log("- Are you in a private location?");
    return new Promise(resolve => rl.question('\nType "yes" to confirm these security measures: ', answer => {
        if (answer.toLowerCase() !== 'yes') {
            console.log('Security checks failed. Please ensure proper security measures.');
            process.exit(1);
        }
        resolve();
    }));
}

async function promptForRoll(wordNum) {
    console.log(`\nRolling for word ${wordNum}/11:`);
    const d20 = validateRoll(
        await new Promise(resolve => rl.question('Enter d20 roll (1-20): ', resolve)),
        'd20'
    );
    const d10_1 = validateRoll(
        await new Promise(resolve => rl.question('Enter first d10 roll (1-10): ', resolve)),
        'd10'
    );
    const d10_2 = validateRoll(
        await new Promise(resolve => rl.question('Enter second d10 roll (1-10): ', resolve)),
        'd10'
    );
    const d10_3 = validateRoll(
        await new Promise(resolve => rl.question('Enter third d10 roll (1-10): ', resolve)),
        'd10'
    );
    
    return diceToIndex(d20, d10_1, d10_2, d10_3);
}

function wordToIndex(word) {
    return wordlist.indexOf(word.toLowerCase());
}

function indicesToBinary(indices) {
    return indices.map(index => 
        index.toString(2).padStart(11, '0')
    ).join('');
}

function bitsToBytes(bitString) {
    // Split entropy into 8-bit chunks (last chunk may be partial)
    const byteStrings = bitString.match(/.{1,8}/g);
    
    // Convert each chunk to a number, padding if needed
    return byteStrings.map(bits => 
        parseInt(bits.padEnd(8, '0'), 2)
    );
}

async function generatePhrase() {
    showInstructions();
    await verifyEntropySource();
    
    const words = [];
    
    for (let i = 1; i <= 11; i++) {
        const index = await promptForRoll(i);
        const word = wordlist[index];
        words.push(word);
        console.log(`Word ${i}: ${word}`);
        console.log('Please write this word down securely before continuing.');
        await new Promise(resolve => rl.question('Press Enter when ready for next word...', resolve));
    }

    // Generate checksum word
    const phrase = words.join(' ');
    const hash = createHash('sha256').update(phrase).digest('hex');
    const checksumIndex = parseInt(hash.slice(0, 4), 16) % wordlist.length;
    const checksumWord = wordlist[checksumIndex];
    
    words.push(checksumWord);
    console.log(`\nChecksum word (12th word): ${checksumWord}`);
    
    const finalPhrase = words.join(' ');
    const wallet = wordlists.mnemonicToAccount(finalPhrase);
    
    console.log('\nFinal seed phrase (verify each word carefully):', finalPhrase);
    console.log('Ethereum address:', wallet.address);
    
    rl.close();
}

async function deriveFromExistingWords() {
    console.log("\nEnter your 11 existing words, one at a time:");
    const words = [];
    
    for (let i = 1; i <= 11; i++) {
        const word = await new Promise(resolve => 
            rl.question(`Word ${i}: `, resolve));
        
        const normalizedWord = word.toLowerCase().trim();
        if (!wordlist.includes(normalizedWord)) {
            console.log(`Warning: "${word}" is not in the BIP39 wordlist!`);
            process.exit(1);
        }
        words.push(normalizedWord);
    }

    console.log("\nValidated words:", words);
    
    const checksumWord = generateChecksumWord(words);
    console.log("Generated checksum word:", checksumWord);
    
    words.push(checksumWord);
    const finalPhrase = words.join(' ');
    console.log("Final phrase:", finalPhrase);
    
    try {
        const wallet = wordlists.mnemonicToAccount(finalPhrase);
        console.log('Ethereum address:', wallet.address);
    } catch (e) {
        console.log("Wallet creation error:", e);
        console.log("Error details:", JSON.stringify(e, null, 2));
    }
    
    rl.close();
}

async function main() {
    console.log("Choose mode:");
    console.log("1. Generate new seed phrase with dice rolls");
    console.log("2. Generate checksum word and address from existing 11 words");
    
    const choice = await new Promise(resolve => 
        rl.question("Enter choice (1 or 2): ", resolve));
    
    if (choice === '1') {
        await generatePhrase();
    } else if (choice === '2') {
        await deriveFromExistingWords();
    } else {
        console.log("Invalid choice");
        process.exit(1);
    }
}

// Only run the CLI if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

// Export functions needed for testing
// export { generateChecksumWord };

export function findValidChecksumWords(words) {
    // Validation
    if (!Array.isArray(words) || words.length !== 11) {
        throw new Error(`Expected 11 words; you gave me ${words?.length}`);
    }
    
    words.forEach((word, i) => {
        if (!wordlist.includes(word.toLowerCase())) {
            throw new Error(`Invalid word at position ${i}: ${word}`);
        }
    });
    // Since BIP39 uses 4 bits for checksum,
    // approximately 1/16 of all possible words will be valid
    const validWords = [];
    
    // Try each word in the wordlist
    for (const candidate of wordlist) {
        const phrase = [...words, candidate].join(' ');
        try {
            ethers.Wallet.fromPhrase(phrase);  // Will throw if invalid
            validWords.push(candidate);
        } catch {
            continue;
        }
    }

    return validWords;
}