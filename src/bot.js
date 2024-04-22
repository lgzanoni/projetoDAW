const TelegramBot = require('node-telegram-bot-api');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const token = '6780243362:AAFnI7rEuza94xPxzAe8k8fg686I8VAicj0';
const bot = new TelegramBot(token, { polling: true });

let expectEmailNext = {};

bot.onText(/\/echo (.+)/, (msg, match) => {

  const chatId = msg.chat.id;
  const resp = match[1];

  bot.sendMessage(chatId, resp);
});

bot.on('message', async (msg) => {
  if (msg.text.startsWith('/')) {
    return;
  }

  const chatId = msg.chat.id;
  const date = new Date(msg.date * 1000);
  const hours = date.getHours();

  if (expectEmailNext[chatId]) {
    if (validateEmail(msg.text)) {
      try {
        await prisma.email.create({
          data: {
            email: msg.text
          }
        });
        bot.sendMessage(chatId, 'Recebemos o seu email! Por favor aguarde que assim que possivel um membro da nossa equipe entrara em contato.');
        expectEmailNext[chatId] = false;
      } catch (error) {
        bot.sendMessage(chatId, 'Desculpe, houve um erro ao salvar seu e-mail. Por favor, tente novamente.');
        console.error('Erro ao salvar e-mail:', error);
      }
    } else {
      bot.sendMessage(chatId, 'Por favor, tente novamente com um endereço de e-mail válido.');
      expectEmailNext[chatId] = true;
    }
  } else {
    if (hours >= 9 && hours < 18) {
      bot.sendMessage(chatId, 'https://faesa.br');
    } else {
      bot.sendMessage(chatId, 'Parece que a mensagem que você enviou foi após o nosso horário de funcionamento (9:00 às 18:00). Caso tenha interesse que retornemos o contato, deixe seu e-mail na próxima mensagem.');
      expectEmailNext[chatId] = true;
    }
  }
});

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}