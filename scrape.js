const puppeteer = require('puppeteer');

/**
* This is a description
* @param {Integer} scrollTimes how many times to scroll through the comments
* @param {String} link google maps reviews link
* @return {Array} list of review objects
*/

const scrape = async (scrollTimes, link) => {
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();
    await page.setViewport({
   	    width: 1366,
   	    height: 768
    });
    await page.goto(link);

    // move mouse and scroll through the comments
    await page.mouse.move(300,400);
    await new Promise(async (resolve,reject) => {
        let scrollCount = 0;
        try {
            const scrollInterval = setInterval(async () => {
                if (scrollCount < scrollTimes) {
                    await page.mouse.wheel({
                        deltaY: 6000
                    });
                } else {
                    clearInterval(scrollInterval);
                    resolve();
                }
                scrollCount++;
            },3000);
        } catch (e) {
            console.log(e);
            reject();
        }
    });

    // click expand buttons
    const expandButtons = await page.$('.section-expand-review');
    if(expandButtons) {
        await page.$$eval('.section-expand-review', async (buttons) => {
            await new Promise((resolve, reject) => {
                try{
                    for(let i = 0; i < buttons.length; i++){
                        const button = buttons[i];
                        button.click();
                        if(i == buttons.length -1){
                            resolve();
                        }
                    }
                } catch (e) {
                    console.log(e);
                    reject();
                }
            });
        });  
    }

    // push all reviews to reviews array
    const reviews = await page.$$eval('.section-review-content', async (reviews) => {
        const  allReviews = [];
        for (let i = 0; i < reviews.length; i++) {
            const theReview = reviews[i];

            let reviewName;
            let reviewNumberOfReviews;
            let reviewStars;
            let reviewDate;
            let reviewText;
            let reviewPhotoLinks = [];

            try {
                reviewName = theReview.querySelector(".section-review-title > span").innerHTML;
                const replacer = new RegExp('"', 'g');
                reviewName = reviewName.replace(replacer, "'");

                reviewNumberOfReviews = theReview.querySelector(".section-review-subtitle > span:nth-child(2)").innerHTML;
                if(reviewNumberOfReviews.substr(0,1) == '・'){
                    reviewNumberOfReviews = reviewNumberOfReviews.substr(1);
                }

                reviewStars = theReview.querySelector(".section-review-stars").getAttribute("aria-label");
                reviewDate = theReview.querySelector(".section-review-publish-date").innerHTML;
                reviewText = theReview.querySelector(".section-review-review-content > span.section-review-text").innerHTML;
                reviewText = reviewText.replace(replacer, "'");

                const reviewPhotos = theReview.querySelectorAll(".section-review-photo");
                for(reviewPhoto of reviewPhotos){
                    reviewPhotoStyle = reviewPhoto.getAttribute('style');
                    const regExp = /\(([^)]+)\)/;
                    const reviewPhotoLink = regExp.exec(reviewPhotoStyle)[1];
                    reviewPhotoLinks.push(reviewPhotoLink);
                } 
            } catch(e) {
                console.log(e);
            }

            allReviews.push({reviewName, reviewNumberOfReviews, reviewStars, reviewDate, reviewText, reviewPhotoLinks});
        }
        return allReviews;
    });
    
    return reviews;
}