/**
 * Middleware de rate limiting pour l'API imprimante
 * Protège contre les abus et les requêtes excessives
 */

const { RateLimiterMemory } = require('rate-limiter-flexible');

// Configuration du rate limiting
const rateLimiter = new RateLimiterMemory({
  points: 100, // 100 points
  duration: 60, // par 60 secondes
  blockDuration: 300, // bloquer pendant 5 minutes si dépassé
});

// Middleware Express
const rateLimiterMiddleware = (req, res, next) => {
  const clientId = req.headers['x-api-key'] || req.ip || 'anonymous';
  
  rateLimiter.consume(clientId, 1) // Consume 1 point par requête
    .then((rateLimiterRes) => {
      // Ajouter les headers de rate limiting à la réponse
      res.set({
        'X-RateLimit-Limit': 100,
        'X-RateLimit-Remaining': rateLimiterRes.remainingPoints,
        'X-RateLimit-Reset': Math.ceil(rateLimiterRes.msBeforeNext / 1000),
      });
      
      // Stocker les infos de rate limiting dans la requête pour les logs
      req.rateLimit = {
        clientId,
        remaining: rateLimiterRes.remainingPoints,
        reset: rateLimiterRes.msBeforeNext,
      };
      
      next();
    })
    .catch((rateLimiterRes) => {
      // Trop de requêtes
      res.set({
        'X-RateLimit-Limit': 100,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': Math.ceil(rateLimiterRes.msBeforeNext / 1000),
        'Retry-After': Math.ceil(rateLimiterRes.msBeforeNext / 1000),
      });
      
      res.status(429).json({
        error: 'Trop de requêtes',
        message: 'Veuillez patienter avant de faire de nouvelles requêtes',
        retryAfter: Math.ceil(rateLimiterRes.msBeforeNext / 1000),
      });
    });
};

module.exports = rateLimiterMiddleware;