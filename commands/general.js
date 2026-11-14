
import { buildMenu } from "../lib/menu.js";

function formatDuration(seconds) {
  let remaining = Math.max(0, Math.floor(Number(seconds) || 0));
  const days = Math.floor(remaining / 86400);
  remaining %= 86400;
  const hours = Math.floor(remaining / 3600);
  remaining %= 3600;
  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const parts = [];
  if (days) parts.push(days + "d");
  if (hours) parts.push(hours + "h");
  if (minutes) parts.push(minutes + "m");
  if (secs || !parts.length) parts.push(secs + "s");
  return parts.join(" ");
}

function messageTimestampMs(message) {
  const raw = message && message.messageTimestamp;
  const value = raw && typeof raw.toNumber === "function" ? raw.toNumber() : Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value > 1000000000000 ? value : value * 1000;
}

function ownerNumber(config) {
  const owners = Array.isArray(config.ownerNumbers) ? config.ownerNumbers : [];
  return String(owners[0] || "").replace(/\D/g, "");
}

const commands = [
  {
    name: "menu",
    aliases: ["helpme"],
    category: "General",
    description: "Show the Hauntie MD menu and available command sections.",
    run: async ctx => {
      const menu = buildMenu({
        commands: ctx.commands,
        config: ctx.config,
        theme: ctx.theme
      });

      if (ctx.config.imageUrl) {
        try {
          await ctx.send({
            image: { url: ctx.config.imageUrl },
            caption:
              "⚡ *𝙃𝘼𝙐𝙉𝙏𝙄𝙀 𝙈𝘿*\n" +
              "◈ Your Smart WhatsApp Assistant\n\n" +
              "✧ Official Portal: " + (ctx.config.botUrl || "Not configured") + "\n" +
              "◈ Fast Replies • Smart Help • Always Here\n\n" +
              "⚡ Powered by Hauntie MD"
          });
        } catch (error) {
          console.warn(
            "Hauntie MD menu artwork could not be sent; using the text menu:",
            error?.message || error
          );
        }
      }

      await ctx.reply(menu);
    }
  },

  {
    name: "help",
    category: "General",
    description: "List registered commands and their descriptions.",
    run: async ctx => {
      const rows = (ctx.commands || [])
        .filter(command => !command.hidden)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(command =>
          ctx.config.prefix + command.name +
          (command.description ? " ┊ " + command.description : "")
        );

      const header =
        "╭━━━⟪ ⚡ 𝙃𝘼𝙐𝙉𝙏𝙄𝙀 𝙈𝘿 · 𝙃𝙀𝙇𝙋 ⟫━━━✦\n" +
        "┃ ◈ " + rows.length + " Registered Commands\n" +
        "╰━━━━━━━━━━━━━━━◈\n\n";

      const chunks = [];
      let current = header;

      for (const row of rows) {
        if (current.length + row.length + 1 > 3300) {
          chunks.push(current.trimEnd());
          current =
            "╭━━━⟪ 𝙃𝙀𝙇𝙋 · 𝘾𝙊𝙉𝙏𝙄𝙉𝙐𝙀𝘿 ⟫━━━✦\n\n";
        }
        current += "┃ ✧ ⟡ " + row + "\n";
      }

      if (current.trim()) chunks.push(current.trimEnd());

      for (const chunk of chunks) {
        await ctx.reply(chunk);
      }
    }
  },

  {
    name: "ping",
    category: "General",
    description: "Check bot responsiveness and estimated message response time.",
    run: async ctx => {
      const timestamp = messageTimestampMs(ctx.msg);
      const responseMs = timestamp === null
        ? null
        : Math.max(0, Date.now() - timestamp);

      await ctx.reply([
        "╭━━━⟪ ⚡ 𝙃𝘼𝙐𝙉𝙏𝙄𝙀 𝙈𝘿 · 𝙋𝙊𝙉𝙂 ⟫━━━✦",
        "┃ ◈ Status: " + (ctx.connectionOpen ? "Online 🟢" : "Connecting 🟡"),
        "┃ ◈ Response: " + (responseMs === null ? "Unavailable" : responseMs + " ms"),
        "┃ ◈ Uptime: " + formatDuration(process.uptime()),
        "┃ ◈ Version: " + ctx.config.version,
        "╰━━━━━━━━━━━━━━━◈"
      ].join("\n"));
    }
  },

  {
    name: "alive",
    aliases: ["uptime"],
    category: "General",
    description: "Show bot status, mode and uptime.",
    run: async ctx => {
      await ctx.reply([
        "╭━━━⟪ 🤖 𝙃𝘼𝙐𝙉𝙏𝙄𝙀 𝙈𝘿 ⟫━━━✦",
        "┃ ◈ Status: " + (ctx.connectionOpen ? "Online 🟢" : "Connecting 🟡"),
        "┃ ◈ Mode: " + String(ctx.mode || "public").toUpperCase(),
        "┃ ◈ Uptime: " + formatDuration(process.uptime()),
        "┃ ◈ Owner: " + ctx.config.ownerName,
        "╰━━━━━━━━━━━━━━━◈",
        "",
        "⚡ Your Smart WhatsApp Assistant"
      ].join("\n"));
    }
  },

  {
    name: "owner",
    category: "General",
    description: "Show bot owner details.",
    run: async ctx => {
      const number = ownerNumber(ctx.config);

      await ctx.reply([
        "╭━━━⟪ 👑 𝘽𝙊𝙏 𝙊𝙒𝙉𝙀𝙍 ⟫━━━✦",
        "┃ ◈ Name: " + ctx.config.ownerName,
        ...(number ? ["┃ ◈ Contact: +" + number] : []),
        "┃ ◈ Bot: HAUNTIE MD",
        "╰━━━━━━━━━━━━━━━◈"
      ].join("\n"));
    }
  },

  {
    name: "support",
    category: "General",
    description: "Show support guidance for Hauntie MD.",
    run: async ctx => {
      await ctx.reply([
        "╭━━━⟪ 🛟 𝙃𝘼𝙐𝙉𝙏𝙄𝙀 𝙎𝙐𝙋𝙋𝙊𝙍𝙏 ⟫━━━✦",
        "┃ ◈ Need assistance?",
        "┃ ◈ Setup help and bug reports:",
        "┃ ◈ Contact: " + ctx.config.ownerName,
        "╰━━━━━━━━━━━━━━━◈",
        "",
        "🌐 GitHub:",
        "https://github.com/Benfeitech/FEI-XMD",
        "",
        "⚡ We're here to help!"
      ].join("\n"));
    }
  },

  {
    name: "time",
    category: "General",
    description: "Show the current server time in Nigeria.",
    run: async ctx => {
      const value = new Intl.DateTimeFormat("en-NG", {
        timeZone: "Africa/Lagos",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }).format(new Date());

      await ctx.reply(
        "╭━━━⟪ 🕒 𝙉𝙄𝙂𝙀𝙍𝙄𝘼 𝙏𝙄𝙈𝙀 ⟫━━━✦\n" +
        "┃ ◈ " + value + "\n" +
        "┃ ◈ Time Zone: WAT (UTC+1)\n" +
        "╰━━━━━━━━━━━━━━━◈"
      );
    }
  },

  {
    name: "date",
    category: "General",
    description: "Show the current date in Nigeria.",
    run: async ctx => {
      const value = new Intl.DateTimeFormat("en-NG", {
        timeZone: "Africa/Lagos",
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      }).format(new Date());

      await ctx.reply(
        "╭━━━⟪ 📅 𝘾𝘼𝙇𝙀𝙉𝘿𝘼𝙍 ⟫━━━✦\n" +
        "┃ ◈ Date: " + value + "\n" +
        "┃ ◈ Region: Nigeria 🇳🇬\n" +
        "╰━━━━━━━━━━━━━━━◈"
      );
    }
  },

  {
    name: "version",
    category: "General",
    description: "Show Hauntie MD version and connection status.",
    run: async ctx => {
      await ctx.reply([
        "╭━━━⟪ 🤖 𝙎𝙔𝙎𝙏𝙀𝙈 𝙄𝙉𝙁𝙊 ⟫━━━✦",
        "┃ ◈ Bot: " + (ctx.config.name || "Hauntie MD"),
        "┃ ◈ Version: v" + ctx.config.version,
        "┃ ◈ Status: " + (ctx.connectionOpen ? "Online 🟢" : "Connecting 🟡"),
        "┃ ◈ Mode: " + String(ctx.mode || "public").toUpperCase(),
        "┃ ◈ Engine: Baileys",
        "╰━━━━━━━━━━━━━━━◈",
        "",
        "⚡ Powered by Hauntie MD"
      ].join("\n"));
    }
  },

  {
    name: "jid",
    aliases: ["id"],
    category: "General",
    description: "Show the current chat and message sender IDs.",
    run: async ctx => {
      await ctx.reply([
        "╭━━━⟪ 🆔 𝘾𝙃𝘼𝙏 𝙄𝙉𝙁𝙊 ⟫━━━✦",
        "┃ ◈ Chat ID: " + ctx.jid,
        "┃ ◈ Sender ID: " + (ctx.senderJid || "Unavailable"),
        "╰━━━━━━━━━━━━━━━◈"
      ].join("\n"));
    }
  },

  {
    name: "whoami",
    category: "General",
    description: "Show your WhatsApp sender information.",
    run: async ctx => {
      await ctx.reply([
        "╭━━━⟪ 👤 𝙐𝙎𝙀𝙍 𝙋𝙍𝙊𝙁𝙄𝙇𝙀 ⟫━━━✦",
        "┃ ◈ Name: " + (ctx.msg?.pushName || "Unknown"),
        "┃ ◈ Your ID: " + (ctx.senderJid || "Unavailable"),
        "┃ ◈ Bot Owner: " + (ctx.owner ? "Yes 👑" : "No"),
        "╰━━━━━━━━━━━━━━━◈"
      ].join("\n"));
    }
  }
];

export default commands;
