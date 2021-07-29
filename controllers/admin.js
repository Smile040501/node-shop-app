const fileHelper = require("../utils/file.js");

const { validationResult } = require("express-validator");
const normalize = require("normalize-path");

const Product = require("../models/product.js");

exports.getAddProduct = (req, res, next) => {
    res.render("admin/editProduct", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
    });
};

exports.postAddProduct = (req, res, next) => {
    const { title, description, price } = req.body;
    const image = req.file;
    if (!image) {
        return res.status(422).render("admin/editProduct", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            editing: false,
            hasError: true,
            product: { title, price, description },
            errorMessage: "Attached file is not an image.",
            validationErrors: [],
        });
    }
    const imageUrl = normalize(image.path);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("admin/editProduct", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            editing: false,
            hasError: true,
            product: { title, price, description },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }

    const product = new Product({
        title,
        price,
        description,
        imageUrl,
        userId: req.user,
    });

    product
        .save()
        .then((result) => {
            console.log("Created Product!");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = !!req.query.edit;
    console.log(editMode);
    if (!editMode) {
        return res.redirect("/");
    }

    const { productId } = req.params;
    Product.findById(productId)
        .then((product) => {
            if (!product) {
                return res.redirect("/");
            }
            res.render("admin/editProduct", {
                pageTitle: "Edit Product",
                path: "/admin/edit-product",
                editing: editMode,
                product: product,
                hasError: false,
                errorMessage: null,
                validationErrors: [],
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    const { title, description, price, productId } = req.body;
    const image = req.file;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("admin/editProduct", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            editing: true,
            hasError: true,
            product: { title, price, description, _id: productId },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }

    Product.findById(productId)
        .then((product) => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect("/");
            }
            product.title = title;
            product.price = price;
            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            product.description = description;
            return product.save().then((result) => {
                console.log("Updated Product!");
                res.redirect("/admin/products");
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProducts = (req, res, next) => {
    Product.find({ userId: req.user._id })
        // .select("title price -_id") // which fields to include, '-' to exclude them
        // .populate("userId", "name") // which field to populate(work if ref is defined for that field), which fields to include as 2nd arg
        .then((products) => {
            res.render("admin/products", {
                prods: products,
                pageTitle: "Admin Products",
                path: "/admin/products",
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.deleteProduct = (req, res, next) => {
    const { productId } = req.params;
    Product.findById(productId)
        .then((product) => {
            if (!product) {
                return next(new Error("Product not found.;"));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: productId, userId: req.user._id });
        })
        .then(() => {
            console.log("Product Deleted!");
            res.status(200).json({ message: "Success!" });
        })
        .catch((err) => {
            res.status(500).json({ message: "Deleting Product Failed!" });
        });
};
