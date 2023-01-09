const { Product } = require('../models/product')
const express = require('express')
const { Category } = require('../models/category')
const router = express.Router()
const mongoose = require('mongoose')
const multer = require('multer')
const { expressjwt } = require('express-jwt')

/* router.get(`/`, async (req, res) => {
    const productList = await Product.find()

    if (!productList) {
        res.status(501).json({
            success: false
        })
    }

    res.send(productList)
})
 */

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype]
        let uploadError = new Error('invalid image type')

        if (isValid) {
            uploadError = null
        }
        cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-')
        const extension = FILE_TYPE_MAP[file.mimetype]
        cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
})

const uploadOptions = multer({ storage: storage })

router.get(`/`, async (req, res) => {
    let filter = {}

    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') }
    }

    const productList = await Product.find(filter)
        //.select('name image -_id') // more perfomatic way to display on frontend
        .populate('category')

    if (!productList) {
        res.status(501).json({
            success: false
        })
    }

    res.send(productList)
})
router.get(`/:productId`, async (req, res) => {
    const productList = await Product.findById(req.params.productId).populate('category')

    if (!productList) {
        res.status(500).json({
            success: false
        })
    }

    res.send(productList)
})

router.get(`/get/count`, async (req, res) => {
    try {
        const productCount = await Product.countDocuments({})

        if (!productCount) {
            res.status(500).json({
                success: false
            })
        }

        res.send({
            productCount: productCount
        })
    } catch (e) {
        return res.status(500).json({ error: e })
    }
})

router.get(`/get/featured/:count`, async (req, res) => {
    //  router.get(`/get/featured`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0
    const products = await Product.find({ isFeatured: true })
        .limit(+count) //plus signal represent i am coverting the type to a number in the paramenter Instead of a string

    if (!products) {
        res.status(500).json({
            success: false
        })
    }

    res.send(products)

})

router.post(`/`, uploadOptions.single('image'), async (req, res) => {

    const category = await Category.findById(req.body.category)
    if (!category) return res.status(400).send('Invalid Category')

    const file = req.file
    if (!file) return res.status(400).send('No image in the request')


    const fileName = req.file.filename
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    })

    product = await product.save()

    if (!product) {
        return res.status(500).send('The product cannot be created')
    }
    res.send(product);
})


router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).send('Invalid Product Id')
    }

    const category = await Category.findById(req.body.category)
    if (!category) {
        return res.status(400).send('Invalid Category')
    }

    const product = await Product.findById(req.params.id)
    if (product) return res.status(400).send('Invalid product!')

    const file = req.file
    let imagesPath

    if (file) {
        const fileName = file.filename
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`
        imagesPath = `${basePath}${fileName}`
    } else {
        imagesPath = product.image;
    }

    const updatedProduct = await Category.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            image: req.body.image,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        },
        { new: true }
    )
    if (!updatedProduct)
        return res.status(200).send('the product cannot be updated')

    res.send(updatedProduct)

})

router.put('/gallery-images/:id'
    , uploadOptions.array('images', 10)
    , async (req, res) => {

        if (!mongoose.isValidObjectId(req.params.id)) {
            res.status(400).send('Invalid Product Id')
        }
        const files = req.files
        let imagesPath = []
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`

        if (files) {
            files.map(file => {
                imagesPath.push(`${basePath}${file.filename}`)
            })
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {

                images: imagesPath,
            },
            { new: true }
        )

        if (!product) {
            return res.status(500).send('The product cannot be Updated')
        }
        res.send(product);
    })

router.delete('/:id', async (req, res) => {

    Product.findByIdAndRemove(req.params.id).then(product => {
        if (product) {
            return res.status(200).json({ success: true, message: 'the product was deleted' })
        } else {
            return res.status(404).json({ success: false, message: 'the product was not found' })
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err })
    })
})

module.exports = router