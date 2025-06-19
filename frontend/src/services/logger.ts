import pino from 'pino';

// Configuración simple basada en el entorno
const isDev = import.meta.env.DEV;

// Logger simple para React/Browser
export const logger = pino({
  level: isDev ? 'debug' : 'info',
  browser: {
    asObject: true,
  },
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
});

// Helper simple para componentes
export const createComponentLogger = (componentName: string) => {
  return {
    info: (message: string, data?: any) => 
      logger.info({ component: componentName, ...data }, message),
    
    warn: (message: string, data?: any) => 
      logger.warn({ component: componentName, ...data }, message),
    
    error: (message: string, data?: any) => 
      logger.error({ component: componentName, ...data }, message),
    
    debug: (message: string, data?: any) => 
      logger.debug({ component: componentName, ...data }, message),
  };
};