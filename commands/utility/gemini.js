const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../../logger");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gemini")
    .setDescription("Chat with Google's Gemini AI")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("chat")
        .setDescription("Ask Gemini a question")
        .addStringOption((option) =>
          option
            .setName("prompt")
            .setDescription("Your question or prompt for Gemini")
            .setRequired(true)
            .setMaxLength(2000)
        )
        .addStringOption((option) =>
          option
            .setName("model")
            .setDescription("Choose Gemini model")
            .addChoices(
              { name: "Gemini 2.0 Flash", value: "gemini-2.0-flash" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("image")
        .setDescription("Analyze an image with Gemini vision")
        .addStringOption((option) =>
          option
            .setName("prompt")
            .setDescription("What do you want to know about the image?")
            .setRequired(true)
            .setMaxLength(1000)
        )
        .addAttachmentOption((option) =>
          option
            .setName("image")
            .setDescription("The image to analyze")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("code")
        .setDescription("Get help with code from Gemini")
        .addStringOption((option) =>
          option
            .setName("question")
            .setDescription("Your coding question")
            .setRequired(true)
            .setMaxLength(2000)
        )
        .addStringOption((option) =>
          option
            .setName("language")
            .setDescription("Programming language")
            .addChoices(
              { name: "JavaScript", value: "javascript" },
              { name: "TypeScript", value: "typescript" },
              { name: "Python", value: "python" },
              { name: "Java", value: "java" },
              { name: "C++", value: "cpp" },
              { name: "C#", value: "csharp" },
              { name: "Go", value: "go" },
              { name: "Rust", value: "rust" },
              { name: "Other", value: "other" }
            )
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      // Check if API key is configured
      if (!process.env.GEMINI_API_KEY) {
        return await interaction.reply({
          content: "❌ Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.",
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      if (subcommand === "chat") {
        await handleChat(interaction);
      } else if (subcommand === "image") {
        await handleImage(interaction);
      } else if (subcommand === "code") {
        await handleCode(interaction);
      }
    } catch (error) {
      logger.error("Error in Gemini command:", error);
      
      const errorMessage = error.message || "An unknown error occurred";
      await interaction.editReply({
        content: `❌ Error: ${errorMessage}`,
      });
    }
  },
};

async function handleChat(interaction) {
  const prompt = interaction.options.getString("prompt");
  const modelName = interaction.options.getString("model") || "gemini-1.5-flash";

  const model = genAI.getGenerativeModel({ model: modelName });

  logger.info(`Gemini chat request from ${interaction.user.tag}: ${prompt.substring(0, 50)}...`);

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const embed = new EmbedBuilder()
    .setColor(0x4285f4)
    .setTitle("💬 Gemini AI Response")
    .setDescription(text.length > 4096 ? text.substring(0, 4093) + "..." : text)
    .addFields(
      { name: "Model", value: modelName, inline: true },
      { name: "Prompt", value: prompt.length > 100 ? prompt.substring(0, 97) + "..." : prompt, inline: false }
    )
    .setFooter({ text: `Requested by ${interaction.user.tag}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleImage(interaction) {
  const prompt = interaction.options.getString("prompt");
  const attachment = interaction.options.getAttachment("image");

  // Validate image
  if (!attachment.contentType?.startsWith("image/")) {
    return await interaction.editReply({
      content: "❌ Please provide a valid image file (PNG, JPG, GIF, WebP)",
    });
  }

  // Check file size (max 20MB for Gemini)
  if (attachment.size > 20 * 1024 * 1024) {
    return await interaction.editReply({
      content: "❌ Image is too large. Maximum size is 20MB.",
    });
  }

  logger.info(`Gemini image analysis from ${interaction.user.tag}: ${attachment.url}`);

  // Download image
  const imageResponse = await fetch(attachment.url);
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageBase64 = Buffer.from(imageBuffer).toString("base64");

  // Get the image mime type
  const mimeType = attachment.contentType;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    },
  ]);

  const response = result.response;
  const text = response.text();

  const embed = new EmbedBuilder()
    .setColor(0x4285f4)
    .setTitle("🖼️ Gemini Vision Analysis")
    .setDescription(text.length > 4096 ? text.substring(0, 4093) + "..." : text)
    .setImage(attachment.url)
    .addFields({ name: "Question", value: prompt, inline: false })
    .setFooter({ text: `Requested by ${interaction.user.tag}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleCode(interaction) {
  const question = interaction.options.getString("question");
  const language = interaction.options.getString("language") || "general";

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const codePrompt = `You are a helpful coding assistant. The user is asking about ${language} programming.

Question: ${question}

Please provide a clear, concise answer with code examples if applicable. Format code blocks properly with markdown.`;

  logger.info(`Gemini code help from ${interaction.user.tag}: ${question.substring(0, 50)}...`);

  const result = await model.generateContent(codePrompt);
  const response = result.response;
  const text = response.text();

  // Split response if too long
  if (text.length > 4096) {
    const chunks = splitResponse(text, 4000);
    
    const firstEmbed = new EmbedBuilder()
      .setColor(0x4285f4)
      .setTitle("💻 Gemini Code Assistant")
      .setDescription(chunks[0])
      .addFields(
        { name: "Language", value: language, inline: true },
        { name: "Question", value: question.length > 100 ? question.substring(0, 97) + "..." : question, inline: false }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag} • Part 1/${chunks.length}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [firstEmbed] });

    // Send remaining parts
    for (let i = 1; i < chunks.length; i++) {
      const embed = new EmbedBuilder()
        .setColor(0x4285f4)
        .setDescription(chunks[i])
        .setFooter({ text: `Part ${i + 1}/${chunks.length}` });

      await interaction.followUp({ embeds: [embed] });
    }
  } else {
    const embed = new EmbedBuilder()
      .setColor(0x4285f4)
      .setTitle("💻 Gemini Code Assistant")
      .setDescription(text)
      .addFields(
        { name: "Language", value: language, inline: true },
        { name: "Question", value: question.length > 100 ? question.substring(0, 97) + "..." : question, inline: false }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}

// Helper function to split long responses
function splitResponse(text, maxLength) {
  const chunks = [];
  let current = "";

  const lines = text.split("\n");

  for (const line of lines) {
    if ((current + line + "\n").length > maxLength) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      
      // If single line is too long, split it
      if (line.length > maxLength) {
        for (let i = 0; i < line.length; i += maxLength) {
          chunks.push(line.substring(i, i + maxLength));
        }
      } else {
        current = line + "\n";
      }
    } else {
      current += line + "\n";
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}
