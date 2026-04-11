import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// Reward amount in SOL — small for hackathon demo
const REWARD_AMOUNT_SOL = 0.01;

// Load the house wallet that pays out rewards
const getHouseWallet = () => {
  const privateKeyStr = process.env.SOLANA_REWARD_WALLET_PRIVATE_KEY;
  if (!privateKeyStr || privateKeyStr === 'your_wallet_private_key') {
    return null;
  }
  try {
    const privateKeyArray = JSON.parse(privateKeyStr);
    return Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
  } catch {
    return null;
  }
};

// Sends a small SOL reward to the winner's wallet
export const sendWinnerReward = async (winnerWalletAddress) => {
  const houseWallet = getHouseWallet();
  if (!houseWallet) {
    console.log('[Solana] No house wallet configured — skipping reward');
    return { success: false, reason: 'no_wallet_configured' };
  }

  try {
    const winnerPubkey = new PublicKey(winnerWalletAddress);
    const lamports = REWARD_AMOUNT_SOL * LAMPORTS_PER_SOL;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: houseWallet.publicKey,
        toPubkey: winnerPubkey,
        lamports,
      })
    );

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [houseWallet]
    );

    console.log(`[Solana] Reward sent! TX: ${signature}`);
    return { success: true, signature, amount: REWARD_AMOUNT_SOL };
  } catch (err) {
    console.error('[Solana] Reward failed:', err.message);
    return { success: false, reason: err.message };
  }
};

// Verifies a wallet owns a particular NFT role (for premium roles)
export const verifyNFTOwnership = async (walletAddress, mintAddress) => {
  try {
    const walletPubkey = new PublicKey(walletAddress);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );

    return tokenAccounts.value.some(
      (account) =>
        account.account.data.parsed.info.mint === mintAddress &&
        account.account.data.parsed.info.tokenAmount.uiAmount > 0
    );
  } catch {
    return false;
  }
};

// Gets the SOL balance for a wallet (used to show in UI)
export const getWalletBalance = async (walletAddress) => {
  try {
    const pubkey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
};
