# Geometry UCT Dash

Mobile-first Geometry Dash-style runner using the supplied orange/white image as the player character, Sphere Connect on Unicity testnet2, real PostgreSQL leaderboard data, 5 UCT = 20 attempts, and a weekly reward-pool ledger.

## What is implemented

- Sphere Connect is required before gameplay.
- Testnet2 network id 4, UCT coin id and 18 decimals are prefilled from the official testnet2 token registry.
- A 5 UCT deposit is requested through the connected Sphere wallet and gives 20 attempts.
- Each game over consumes one attempt.
- Runs are stored server-side in Neon/Postgres; leaderboard is not hardcoded.
- Server validates run duration, distance, attempt ownership and a per-run nonce. Duplicate run IDs are rejected.
- 50% of accepted deposit amounts are included in the weekly reward-pool ledger.
- Weekly payout execution is intentionally wallet-confirmed: the admin connects a Sphere wallet and signs each payout from that wallet. The app never stores a private key.
- The supplied image is copied to `public/player.jpeg` and used as the player sprite.

## Important deployment configuration

You must provide `NEXT_PUBLIC_SPHERE_TREASURY_ADDRESS`. This is the Sphere address that receives deposits. Do not invent one.

You also need `GAME_SESSION_SECRET` (a long random secret used to protect run submissions) and a Neon/Postgres database connected to Vercel. Vercel's current templates support Neon Postgres integrations. After connecting it, put the generated `DATABASE_URL` into the project environment.

The testnet2 UCT registry currently defines UCT as 18 decimals with coin id `f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0`.

## Deploy from a phone

1. Create a GitHub repository.
2. Upload this folder as the repository contents. No terminal is required.
3. In Vercel, import the GitHub repository.
4. Add a Neon Postgres integration or set `DATABASE_URL` manually.
5. Add the environment variables from `.env.example`.
6. Deploy.
7. Open the Vercel URL over HTTPS and test with a Sphere testnet2 wallet.

## Sphere Connect permissions

The dApp requests only `identity:read` and `transfer:request` for the player flow. The wallet remains in control of every token transfer. The Connect protocol requires the dApp to declare `SPHERE_NETWORKS.testnet2` and uses `autoConnect` in the browser.

## Deposit receipt model

After the wallet confirms a 5 UCT transfer, the client receives the Sphere transfer id. The app then asks the same wallet to sign a receipt containing the transfer id, amount, treasury address, and a server nonce. The server verifies the signature against the connected chain public key and stores the deposit once. This prevents duplicate receipts and ties the credit to the connected wallet.

For a fully independent treasury reconciliation service, replace/add a backend chain-indexer check for the transfer id. The current version is designed to be deployable without putting a treasury private key on Vercel.

## Weekly rewards

Open `/admin` to connect the configured admin Sphere wallet and execute winner payouts. Enter the amount for each winner and approve the transfer in Sphere. Payout receipts are recorded in Postgres so a transfer id cannot be recorded twice.

The database calculates the pool from accepted deposits: `reward_pool = total_deposits * 0.50`. The remaining 50% is not included in the weekly reward pool. The weekly winners are determined by the real leaderboard distance for that ISO week.

Payouts are not automatically signed by a server. An admin must connect the configured admin Sphere wallet and approve each payout in the wallet UI. This keeps private keys out of Vercel.

## Current testnet caveat

Sphere's public SDK repository has reported testnet2 certification/send reliability issues during August 2026. If deposits or payouts show `CERTIFICATION_UNCONFIRMED`, do not resend blindly; the Sphere docs specify reconciliation/resume behavior instead of issuing a second transfer.
