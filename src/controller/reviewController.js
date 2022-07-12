const ReviewModel = require("../models/reviewModel");
const BookModel = require("../model/bookModel");
const validation = require("../validation/validation");
// ============================================{Create ReviewController}==========================================================

const createReview = async function (req, res) {
    try {
        let bookId = req.params.bookId;//req from param
        if (!bookId) {//if not present bookId
            return res.status(400)
                .send({ status: false, message: "please provide bookid" });//res
            }
            let checkBookId = await BookModel.findById(bookId);//checkBookId in database
            if (!checkBookId) {
                return res.status(400).send({ status: false, message: "No such bookId" });//res
            }
            let data = req.body;//req body
            let { review, rating, reviewedBy, reviewedAt } = data;//destucture
            if (Object.keys(data).length == 0) {//key present or not
                return res.status(400).send({
                    status: false,
                    message: "please provide data in request body",//res
                });
            }
            if (!reviewedBy) {//reviewby is present or not
                return res.status(400).send({
                    status: false,
                    message: "please provide review's name is required",//res
                });
            }
            if (!reviewedAt) {//reviewAt is present or not
                return res.status(400).send({
                    status: false,
                    message: "please provide reviewedAt is required",//res
                });
            }
            if (!rating) {//rating is present or not
                return res
                    .status(400)
                    .send({ status: false, message: "please provide rating" })//res
            }
            if (rating > 6 || rating < 0) {//rating is between 1 to 5
                return res
                    .status(400)
                    .send({ status: false, message: "give rating 1 t0 5 " });//res
            }


            if (checkBookId.isDeleted == true) {//check isdeleted is true
                return res.status(400).send({ status: false, message: "Already book deleted then you can not add" })//res
            }

            let reviewData = await ReviewModel.create(data)//create ReviewModel
            if (reviewData) {
                await BookModel.findOneAndUpdate({ _id: bookId }, { $inc: { reviews: 1 } })//Update the related book document by increasing its review count
            }
            let RD = await ReviewModel.findOne({ _id: reviewData._id }).select({ _v: 0, createdAt: 0, updatedAt: 0, isDeleted: 0 })//Show Data According to ReadME File 
            res.status(201).send({ status: true, message: "review Created", data: RD })//res
        }
     catch (err) {
        return res.status(500).send({ status: false, message: err.message });//res
    }
};
// ============================================{Upadet ReviewController}==========================================================



const updateReview = async function (req, res) {
    try {
        let data = req.body;//req Body
        let { review, rating, reviewedBy } = data;//Destructure
        let bookId = req.params.bookId;//PAram bookId
        let reviewId = req.params.reviewId;//PAram reviewId

        if (!bookId) {//present or not
            return res
                .status(400)
                .send({ status: false, message: "please provide bookId" });//res
        }

        if (!reviewId) {//present or not
            return res
                .status(400)
                .send({ status: false, message: "please provide reviewId" });//res
        }
        
        let checkBookId = await BookModel.findById(bookId)//valid book id
        if (!checkBookId) {
            return res.status(404).send({ status: false, message: "not found bookId" })//res
        }
        
        let checkReviewId = await ReviewModel.findById(reviewId)//review ID valid not not 
        if (!checkReviewId) {
            return res.status(404).send({ status: false, message: "not found reviewId" })//res
            
        }
        if (rating > 6 || rating < 0) {//lies betwen 1 to 5
            return res
                .status(400)
                .send({ status: false, message: "give rating 1 t0 5 " });//res
        }

        let checkDeletedOrNot = await ReviewModel.find({ _id: reviewId, isDeleted: true })//check if isdeleted is true
        if (checkDeletedOrNot.length > 0) {
            return res.status(200).send({ status: true, message: "already deleted" })//res
        }

        let updateReview = await ReviewModel.findOneAndUpdate(
            { _id: reviewId, isDeleted: false },
            { review: review, rating: rating, reviewedBy: reviewedBy },
            { new: true }//here get Updated
        );
        // console.log(updateReview);
        let UPD= checkBookId.toObject()//can make bookid in Object 
        UPD['updatedReview'] = updateReview//updated data is in the form of array
        res
            .status(200)
            .send({ status: true, message: "Books list", data: UPD});//res
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });//res
    }
};
// ============================================{Delete ReviewController}==========================================================

const deleteReview = async function (req, res) {
    try {
        let reviewId = req.params.reviewId;//req param
        if (!reviewId) {
            return res
                .status(400)
                .send({ status: false, message: "please provide review Id" });//res
        }

        let checkId = await ReviewModel.findById(reviewId);
        if (!checkId) {
            return res
                .status(404)
                .send({ status: false, message: "Not found review" });//res
        }
        let bookId = req.params.bookId;
        let Id = checkId.bookId;
        if (bookId != Id) {
            return res
                .status(404)
                .send({ status: false, message: "please provide valid bookId" });//res
        }

        let checkDeletedOrNot = await ReviewModel.find({ _id: reviewId, isDeleted: true })
        if (checkDeletedOrNot.length > 0) {
            return res.status(200).send({ status: true, message: "already deleted" })//res
        }

        let deleteReview = await ReviewModel.findOneAndUpdate(
            { _id: reviewId, isDeleted: false },
            { isDeleted: true, deletedAt: Date.now() },
            { new: true }//update isdeleted true
        );

        //decreasing review count for the book
        let bookReviewCount = await BookModel.findOneAndUpdate(
            { _id: bookId, isDeleted: false }, { $inc: { reviews: -1 } }, { new: true });

        return res.status(200).send({ status: false, message: 'Review Deleted' })//res

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};

module.exports = { createReview, updateReview, deleteReview };
