import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info', // Nível mínimo para registrar mensagens (você pode ajustar isso conforme necessário)
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}] : ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logfile.log' }),
  ],
});