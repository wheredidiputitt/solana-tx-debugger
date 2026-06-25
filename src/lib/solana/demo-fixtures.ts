// Realistic demo fixtures so the UI works even without network access to Solana RPC.
// These mirror the shape returned by Connection.getTransaction() with maxSupportedTransactionVersion=0
// and encoding="jsonParsed".

export const DEMO_TXS: Record<string, any> = {
  // 1. Successful SOL transfer (System Program)
  "5Nh6hM7J7YxNp3FbQFbQf2xQ5wQ5e7X2Y2k9z8s7t6r5p4": {
    slot: 295_456_789,
    blockTime: Math.floor(Date.now() / 1000) - 600,
    meta: {
      fee: 5_000,
      preBalances: [1_000_000_000, 0],
      postBalances: [997_495_000, 2_500_000_000],
      err: null,
      computeUnits: 150,
      logMessages: [
        "Program 11111111111111111111111111111111 invoke [1]",
        "Program 11111111111111111111111111111111 success",
        "Program 11111111111111111111111111111111 consumed 150 of 200000 compute units",
      ],
      innerInstructions: [
        {
          index: 0,
          instructions: [
            {
              programId: "11111111111111111111111111111111",
              parsed: {
                type: "transfer",
                info: {
                  source: "9aF2Qx... Root",
                  destination: "5pXvD... Recipient",
                  lamports: 2_500_000_000,
                },
              },
            },
          ],
        },
      ],
      preTokenBalances: [],
      postTokenBalances: [],
    },
    transaction: {
      message: {
        accountKeys: [
          "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
          "5pXvDRz1WgQ7tJm9s8gQnQD9wQ5e7X2Y2k9z8s7t6r5p",
        ],
        instructions: [
          {
            programId: "11111111111111111111111111111111",
            parsed: {
              type: "transfer",
              info: {
                source: "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
                destination: "5pXvDRz1WgQ7tJm9s8gQnQD9wQ5e7X2Y2k9z8s7t6r5p",
                lamports: 2_500_000_000,
              },
            },
          },
        ],
      },
    },
  },

  // 2. Jupiter swap (SOL → USDC via Jupiter Aggregator)
  "2vHqQ4mZ8t3XQ9zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5p": {
    slot: 295_456_120,
    blockTime: Math.floor(Date.now() / 1000) - 3600,
    meta: {
      fee: 12_345,
      preBalances: [5_000_000_000, 0, 0, 0, 0, 0],
      postBalances: [4_987_543_210, 0, 0, 0, 0, 0],
      err: null,
      computeUnits: 89_432,
      logMessages: [
        "Program ComputeBudget111111111111111111111111111111 invoke [1]",
        "Program ComputeBudget111111111111111111111111111111 success",
        "Program log: Instruction: SetComputeUnitLimit",
        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [1]",
        "Program log: RoutePlan: SOL -> USDC",
        "Program log: Jupiter: swap completed",
        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 87311 of 200000 compute units",
        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success",
      ],
      innerInstructions: [
        {
          index: 1,
          instructions: [
            {
              programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              parsed: {
                type: "transfer",
                info: {
                  source: "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
                  destination: "5pXvDRz1WgQ7tJm9s8gQnQD9wQ5e7X2Y2k9z8s7t6r5p",
                  amount: "2500000000",
                  mint: "So11111111111111111111111111111111111111112",
                },
              },
            },
            {
              programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              parsed: {
                type: "transfer",
                info: {
                  source: "5pXvDRz1WgQ7tJm9s8gQnQD9wQ5e7X2Y2k9z8s7t6r5p",
                  destination: "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
                  amount: "152500",
                  mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                },
              },
            },
          ],
        },
      ],
      preTokenBalances: [
        {
          accountIndex: 1,
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          owner: "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
          uiTokenAmount: { amount: "0", decimals: 6, uiAmount: 0 },
        },
        {
          accountIndex: 2,
          mint: "So11111111111111111111111111111111111111112",
          owner: "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
          uiTokenAmount: { amount: "2500000000", decimals: 9, uiAmount: 2.5 },
        },
      ],
      postTokenBalances: [
        {
          accountIndex: 1,
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          owner: "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
          uiTokenAmount: { amount: "152500", decimals: 6, uiAmount: 0.1525 },
        },
        {
          accountIndex: 2,
          mint: "So11111111111111111111111111111111111111112",
          owner: "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
          uiTokenAmount: { amount: "0", decimals: 9, uiAmount: 0 },
        },
      ],
    },
    transaction: {
      message: {
        accountKeys: [
          "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
          "5pXvDRz1WgQ7tJm9s8gQnQD9wQ5e7X2Y2k9z8s7t6r5p",
          "7nT7q... JUP_ATA",
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
          "ComputeBudget111111111111111111111111111111",
        ],
        instructions: [
          {
            programId: "ComputeBudget111111111111111111111111111111",
            data: "AUANAwA=",
            parsed: { type: "setComputeUnitLimit", info: { units: 200000 } },
          },
          {
            programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
            data: "ZJfmqKAUkNJQ8NkE",
            parsed: { type: "route", info: {} },
          },
        ],
      },
    },
  },

  // 3. Failed tx — insufficient funds
  "3xHqQ9mZ4t7XQ5zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5p": {
    slot: 295_455_001,
    blockTime: Math.floor(Date.now() / 1000) - 7200,
    meta: {
      fee: 5_000,
      preBalances: [3_000, 0],
      postBalances: [0, 0],
      err: { InstructionError: [0, { Custom: 1 }] },
      computeUnits: 89,
      logMessages: [
        "Program 11111111111111111111111111111111 invoke [1]",
        "Program log: Error: InsufficientFunds",
        "Program 11111111111111111111111111111111 failed: custom program error: 0x1",
        "Program 11111111111111111111111111111111 consumed 89 of 200000 compute units",
      ],
      innerInstructions: [],
      preTokenBalances: [],
      postTokenBalances: [],
    },
    transaction: {
      message: {
        accountKeys: [
          "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
          "5pXvDRz1WgQ7tJm9s8gQnQD9wQ5e7X2Y2k9z8s7t6r5p",
        ],
        instructions: [
          {
            programId: "11111111111111111111111111111111",
            parsed: {
              type: "transfer",
              info: {
                source: "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
                destination: "5pXvDRz1WgQ7tJm9s8gQnQD9wQ5e7X2Y2k9z8s7t6r5p",
                lamports: 1_000_000_000,
              },
            },
          },
        ],
      },
    },
  },

  // 4. BONK transfer (token transfer)
  "4yHqQ8mZ5t6XQ4zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5p": {
    slot: 295_454_500,
    blockTime: Math.floor(Date.now() / 1000) - 86400,
    meta: {
      fee: 5_000,
      preBalances: [1_500_000_000, 0, 0],
      postBalances: [1_499_995_000, 0, 0],
      err: null,
      computeUnits: 246,
      logMessages: [
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
        "Program log: Instruction: Transfer",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 246 of 200000 compute units",
        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
      ],
      innerInstructions: [],
      preTokenBalances: [
        {
          accountIndex: 1,
          mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
          owner: "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
          uiTokenAmount: { amount: "10000000", decimals: 5, uiAmount: 100 },
        },
        {
          accountIndex: 2,
          mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
          owner: "5pXvDRz1WgQ7tJm9s8gQnQD9wQ5e7X2Y2k9z8s7t6r5p",
          uiTokenAmount: { amount: "0", decimals: 5, uiAmount: 0 },
        },
      ],
      postTokenBalances: [
        {
          accountIndex: 1,
          mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
          owner: "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
          uiTokenAmount: { amount: "5000000", decimals: 5, uiAmount: 50 },
        },
        {
          accountIndex: 2,
          mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
          owner: "5pXvDRz1WgQ7tJm9s8gQnQD9wQ5e7X2Y2k9z8s7t6r5p",
          uiTokenAmount: { amount: "5000000", decimals: 5, uiAmount: 50 },
        },
      ],
    },
    transaction: {
      message: {
        accountKeys: [
          "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
          "7nT7q9Z4t6XQ4zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5",
          "8xU7q9Z4t6XQ4zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5",
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        ],
        instructions: [
          {
            programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            parsed: {
              type: "transfer",
              info: {
                source: "7nT7q9Z4t6XQ4zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5",
                destination: "8xU7q9Z4t6XQ4zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5",
                amount: "5000000",
                mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
                authority: "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
              },
            },
          },
        ],
      },
    },
  },

  // 5. Complex multi-program tx (Jupiter + Token + Associated Token + System + Memo)
  "5xHqQ7mZ6t5XQ4zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5p": {
    slot: 295_453_100,
    blockTime: Math.floor(Date.now() / 1000) - 172800,
    meta: {
      fee: 25_000,
      preBalances: [10_000_000_000, 0, 0, 0, 0, 0, 0],
      postBalances: [9_997_500_000, 0, 0, 0, 0, 0, 0],
      err: null,
      computeUnits: 145_876,
      logMessages: [
        "Program ComputeBudget111111111111111111111111111111 invoke [1]",
        "Program ComputeBudget111111111111111111111111111111 success",
        "Program log: Instruction: SetComputeUnitPrice",
        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [1]",
        "Program log: Route: BONK -> USDC -> SOL",
        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]",
        "Program log: Swap 1: BONK -> USDC via Raydium",
        "Program log: Swap 2: USDC -> SOL via Orca",
        "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [2]",
        "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success",
        "Program 11111111111111111111111111111111 invoke [2]",
        "Program 11111111111111111111111111111111 success",
        "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [2]",
        "Program log: From Jupiter Aggregator",
        "Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success",
        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 138412 of 200000 compute units",
        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success",
      ],
      innerInstructions: [
        {
          index: 1,
          instructions: [
            {
              programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              parsed: {
                type: "transfer",
                info: {
                  source: "7nT7q9Z4t6XQ4zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5",
                  destination: "8xU7q9Z4t6XQ4zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5",
                  amount: "500000000",
                  mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
                },
              },
            },
            {
              programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              parsed: {
                type: "transfer",
                info: {
                  source: "9xU7q9Z4t6XQ4zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5",
                  destination: "1xU7q9Z4t6XQ4zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5",
                  amount: "20000",
                  mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                },
              },
            },
          ],
        },
      ],
      preTokenBalances: [],
      postTokenBalances: [],
    },
    transaction: {
      message: {
        accountKeys: [
          "9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z",
          "7nT7q9Z4t6XQ4zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5",
          "8xU7q9Z4t6XQ4zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5",
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
          "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
          "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
        ],
        instructions: [
          {
            programId: "ComputeBudget111111111111111111111111111111",
            data: "AdOQ3Q==",
            parsed: { type: "setComputeUnitPrice", info: { microLamports: 100000 } },
          },
          {
            programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
            data: "AQACAQAL",
            parsed: { type: "route", info: {} },
          },
        ],
      },
    },
  },
};

export function findDemoTx(sig: string): any | null {
  // Try exact match
  if (DEMO_TXS[sig]) return DEMO_TXS[sig];

  // Try prefix match (so users can paste just the first part of the demo sig)
  const keys = Object.keys(DEMO_TXS);
  for (const k of keys) {
    if (k.startsWith(sig) || sig.startsWith(k.slice(0, 20))) {
      return DEMO_TXS[k];
    }
  }

  // If signature looks like a real one (~64+ chars base58), return the Jupiter swap demo
  if (sig.length >= 32) {
    return DEMO_TXS["2vHqQ4mZ8t3XQ9zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5p"];
  }

  return null;
}

export const DEMO_SIGNATURES = Object.keys(DEMO_TXS);
