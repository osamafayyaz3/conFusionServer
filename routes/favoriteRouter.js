const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const authenticate = require('../authenticate')
const Favorites = require('../models/favorite')
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json())

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        Favorites.find({})
            .populate(['user', 'dishes'])
            .then((favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }, (err) => next(err))
            .catch((err) => next(err));
    })

    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id }, (err, favorite) => {
            if (err) return next(err);
            if (!favorite) {
                Favorites.create({ user: req.user._id })
                    .then(favorite => {
                        for (let i = 0; i < req.body.length; i++) {
                            if (favorite.dishes.indexOf(req.body[i]._id) < 0) {
                                favorite.dishes.push(req.body[i])
                            }
                        }
                        favorite.save()
                            .then(favorite => {
                                Favorites.findById(favorite._id)
                                    .populate('user')
                                    .populate('dishes')
                                    .then(favorite => {
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(favorite);
                                    })
                            }, (err) => next(err))
                            .catch((err) => next(err))
                    }, (err) => next(err))
                    .catch((err) => next(err))
            }
        })

    })

    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.remove({ user: req.user._id })
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }, (err) => next(err))
            .catch((err) => next(err))
    });

favoriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(favorites => {
                if (!favorites) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json')
                    return res.json({ "exists": false, "favorites": favorites })
                }
                else {
                    if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json')
                        return res.json({ "exists": false, "favorites": favorites })
                    }
                    else {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json')
                        return res.json({ "exists": true, "favorites": favorites })
                    }
                }
            }, err => next(err))
            .catch(err => next(err))
    })

    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(favorite => {
                // console.log(favorite.dishes.includes(req.params.dishId))
                if (favorite.dishes.includes(req.params.dishId)) {
                    err = new Error('Already added')
                    err.status = 404;
                    return next(err)
                }
                else {
                    favorite.dishes.push(req.params.dishId)
                    favorite.save()
                        .then(favorite => {
                            Favorites.findById(favorite._id)
                                    .populate('user')
                                    .populate('dishes')
                                    .then(favorite => {
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(favorite);
                                    })
                        }, (err) => next(err))
                        .catch((err) => next(err))
                }

            }, (err) => next(err))
            .catch((err) => next(err))
    })


    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id }).then(favorite => {
            let index = favorite.dishes.indexOf(req.params.dishId);
            if (index != -1) {
                favorite.dishes.splice(index, 1);
                favorite.save().then(updatedFavorite => {
                    Favorites.findById(updatedFavorite._id)
                        .populate('user')
                        .populate('dishes')
                        .then(
                            updatedFavorite => {
                                res.status = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.json(updatedFavorite);
                            },
                            err => next(err)
                        )
                        .catch(err => next(err));
                });
            } else {
                let err = new Error(
                    "Selected dish is not your favorite dish, request aborted"
                );
                err.status = 403;
                return next(err);
            }
        });
    })

module.exports = favoriteRouter