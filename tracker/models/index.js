const Joi = require('joi');
const utils = require('../utils/utils');
exports.relayNodeAnnouceSchema = Joi.object().keys({
    port: Joi.number().required(),
    publicKey: Joi.string().required(),
    privateKey: Joi.string()
});

const leecherAnnounceObject = Joi.object().keys({
    infoHash: Joi.string().required(),
    replyOnions: Joi.array().min(1).required(),
})

exports.leecherAnnounceSchema = Joi.array().items(leecherAnnounceObject).min(1).required()

exports.leecherRequestSchema = Joi.array().items(Joi.string()).min(1).required()

exports.keyOnly = Joi.object().keys({
    encryptedKey: Joi.string().required(),
})

