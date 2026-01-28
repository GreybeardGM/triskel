/**
 * Generate a standardized chat card with optional header, roll visualization, and content.
 *
 * @param {object} [options={}]
 * @param {string} [options.title=""]        - Optional header title text.
 * @param {string} [options.subtitle=""]     - Optional header subtitle text.
 * @param {string} [options.image=""]        - Optional header image URL.
 * @param {string} [options.content=""]      - HTML content to render inside the body.
 * @param {string} [options.complication=""] - Optional complication line to render.
 * @param {string} [options.complicationTone=""] - Optional complication tone class.
 * @param {string} [options.action=""]       - HTML content for the action row.
 * @param {string} [options.actionTemplate=""] - Handlebars template path for action row.
 * @param {object} [options.actionContext={}]  - Template context for action row.
 * @param {string} [options.footer=""]       - HTML content for the footer row.
 * @param {Roll|null} [options.roll=null]      - Optional Foundry Roll instance to display.
 * @param {string} [options.flavor=""]       - Optional flavor text for the chat message.
 * @param {string|null} [options.rollMode=null]- Roll mode override (defaults to current core roll mode).
 * @param {Array<string>|null} [options.whisper=null] - Explicit whisper recipients; overrides roll mode behavior.
 * @param {boolean} [options.blind=false]      - Whether the message should be blind to players.
 * @param {User|string|null} [options.user=null] - User who sends the message (defaults to current user).
 * @param {Actor|null} [options.actor=null]    - Optional actor to display in a header row.
 */
export async function chatOutput({
  title = "",
  subtitle = "",
  image = "",
  content = "",
  complication = "",
  complicationTone = "",
  action = "",
  actionTemplate = "",
  actionContext = {},
  footer = "",
  roll = null,
  flavor = "",
  rollMode = null,
  whisper = null,
  blind = false,
  user = null,
  actor = null
} = {}) {
  const resolvedUser = user ?? game.user;
  const resolvedUserId = typeof resolvedUser === "string" ? resolvedUser : resolvedUser?.id ?? game.user.id;
  const resolvedSpeaker = ChatMessage.getSpeaker({
    user: resolvedUserId,
    alias: typeof resolvedUser === "string" ? game.user?.name : resolvedUser?.name
  });
  const resolvedRollMode = rollMode ?? game.settings.get("core", "rollMode");
  const gmRecipients = ChatMessage.getWhisperRecipients("GM").map(gm => gm.id);

  let resolvedWhisper = whisper;
  let resolvedBlind = blind;

  if (!Array.isArray(resolvedWhisper)) {
    switch (resolvedRollMode) {
      case "selfroll":
        resolvedWhisper = [resolvedUserId];
        break;
      case "gmroll":
        resolvedWhisper = gmRecipients;
        break;
      case "blindroll":
        resolvedWhisper = gmRecipients;
        resolvedBlind = true;
        break;
      default:
        resolvedWhisper = null;
    }
  }

  let rollHTML = "";

  if (roll) {
    if (!roll._evaluated) {
      await roll.evaluate();
    }

    rollHTML = await roll.render();
  }

  const resolvedTitle = title && game.i18n?.has?.(title)
    ? game.i18n.localize(title)
    : title;
  const resolvedSubtitle = subtitle && game.i18n?.has?.(subtitle)
    ? game.i18n.localize(subtitle)
    : subtitle;
  const resolvedActorName = actor?.system?.details?.fullNameAndTitle || actor?.name || "";
  const resolvedAction = actionTemplate
    ? await foundry.applications.handlebars.renderTemplate(actionTemplate, actionContext)
    : action;
  const resolvedFooter = footer || content;

  const templateData = {
    actorName: resolvedActorName,
    actorImage: actor?.img ?? "",
    hasActor: Boolean(resolvedActorName),
    title: resolvedTitle,
    subtitle: resolvedSubtitle,
    image,
    roll: rollHTML,
    hasHeader: Boolean(resolvedTitle || resolvedSubtitle || image),
    hasRoll: Boolean(roll),
    complication,
    complicationTone: complicationTone || "",
    action: resolvedAction,
    footer: resolvedFooter
  };

  const html = await foundry.applications.handlebars.renderTemplate(
    "systems/triskel/templates/chat/chat-output.hbs",
    templateData
  );

  const messageData = {
    user: resolvedUserId,
    speaker: resolvedSpeaker,
    content: html,
    flavor,
    style: roll ? CONST.CHAT_MESSAGE_STYLES.ROLL : CONST.CHAT_MESSAGE_STYLES.OTHER,
    rolls: roll ? [roll] : undefined,
    sound: roll ? CONFIG.sounds.dice : undefined,
    whisper: resolvedWhisper ?? undefined,
    blind: resolvedBlind || undefined
  };

  return ChatMessage.create(messageData, { rollMode: resolvedRollMode });
}
