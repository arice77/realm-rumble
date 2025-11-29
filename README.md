# **Realm Rush — Web3 PvP Strategy Game**

**Built for the Somnia Data Streams Mini Hackathon (Nov 4–15, 2025)**
**A real-time, on-chain, turn-based PvP battle game powered by Somnia Data Streams.**

---

## ⭐ Overview

**Realm Rush** is a turn-based PvP strategy game where two players battle using three move types—**Attack**, **Defend**, and **Power-Up**.
Every move, game state, and match result is stored **on-chain** using **Somnia Data Streams (SDS)**, enabling true real-time gameplay across browsers and wallets.

---

## 🎮 Game Mechanics

Each player manages:

* **100 HP**
* **Energy (0–5)**
* **Power Multiplier**
* **Up to 15 Turns**

Available actions:

* **Attack** — Deal direct damage
* **Defend** — Block & counterattack
* **Power-Up** — Boost multiplier & heal

The goal: **Reduce your opponent’s HP to 0**.

---

## 🚀 Powered by Somnia Data Streams

Realm Rush uses SDS as the **single source of truth** for live PvP gameplay.

### 🔑 SDS Features Used

* **On-chain match creation**
* **On-chain move submission**
* **Real-time streaming of opponent actions**
* **Persistent on-chain match history**
* **Schema-based structured storage**

### 📦 Data Schemas

1. **Match State Schema** – HP, Energy, Turn, Status
2. **Move Schema** – Move type, turn number, timestamp
3. **Match Result Schema** – Winner, loser, total turns

---

## 🛠 Tech Stack

* **React + TypeScript + Vite**
* **Somnia Data Streams SDK (`@somnia-chain/streams`)**
* **Wagmi + Viem**
* **Tailwind CSS + shadcn-ui**
* **Zustand**
* **Somnia Testnet**

---

## 📦 Installation

```bash
git clone <your-repository-url>
cd realm-rumble

npm install
npm run dev
```

---

## 🎯 How to Play

### **Local Mode**

* Test game mechanics instantly
* No wallet required

### **PvP Mode (Web3)**

1. Connect your Web3 wallet
2. Switch to **Somnia Testnet**
3. Get STT from the faucet
4. **Create** or **Join** a match
5. Submit moves turn-by-turn
6. Wait for on-chain opponent actions via SDS
7. Win by reducing opponent HP to 0

---

## 🔧 SDS Integration (Code Highlights)

### Register Schemas

```ts
await sdk.streams.registerDataSchemas([
  { schemaName: "realmRushMatch", schema: MATCH_STATE_SCHEMA },
  { schemaName: "realmRushMove", schema: MOVE_SCHEMA },
  { schemaName: "realmRushResult", schema: MATCH_RESULT_SCHEMA },
]);
```

### Publish Data

```ts
await sdk.streams.set([
  { id: matchId, schemaId: matchStateSchemaId, data: encodedMatchState },
]);
```

### Stream Updates

```ts
const opponentMoves = await getOnChainMoves(matchId, opponentAddress);
const move = opponentMoves.find(m => m.turnNumber === currentTurn);
```

### Query History

```ts
const allMoves = await sdk.streams.getAllPublisherDataForSchema(
  moveSchemaId,
  publisher
);
```

---

## 🎥 Demo (3–5 Minutes)

👉 **Demo Video:**
**https://youtu.be/6yG-rfXR-No**

---

## 📚 Resources

* Somnia Docs — [https://docs.somnia.network](https://docs.somnia.network)
* Data Streams Info — [https://datastreams.somnia.network](https://datastreams.somnia.network)
* Somnia X — [https://x.com/SomniaEco](https://x.com/SomniaEco)
* Somnia Telegram — [https://t.me/+XHq0F0JXMyhmMzM0](https://t.me/+XHq0F0JXMyhmMzM0)


