const superagent = require('superagent');
const faker = require('faker');

let backendUrl = 'http://localhost:3000';
// let backendUrl = `https://hey-neighbor1.herokuapp.com`;

let outputJson = [];
let rentals = [];

/*
create a user-info object and send it
save the response
*/

let masterVal = 10;

let userNum = masterVal;
let itemCount = masterVal;
let rentalCount = masterVal;
let reviewCount = masterVal;

async function makeUsers(userNum){
  for(let x = 0; x < userNum; x++){
    let userObj = [];
  
    let userInfo = {
      userName:`${faker.name.firstName()}${faker.name.lastName()}`,
      password:'password',
      email:`${faker.internet.email()}`,
      address:`${faker.address.streetAddress()}`,
    };
  
    
    let results = await superagent.post(`${backendUrl}/signup`).send(userInfo);
    
    userInfo.token = results.text;
    
    let userDB = await superagent.get(`${backendUrl}/getMyUser`)
        .set('Authorization', `Bearer ${results.text}`);    
    
    userInfo._id = userDB.body._id
    
    userObj.push(userInfo);
    outputJson.push(userObj);

  }
}

async function makeItems(itemCount){

  for(let i = 0; i < outputJson.length; i++){
    // console.log('outer', outputJson[i]);
    let itemList = [];

    for(let x = 0; x < itemCount; x++){
      let itemInfo = {
          _owner: outputJson[i][0]._id,
          item: `${faker.commerce.productAdjective()} ${faker.commerce.productName()}`,
          type:`${faker.commerce.product()}`,
          subCategory:`${faker.commerce.department()}`,
          description:`${faker.lorem.sentence()}`
        }  
      let itemReturn = await superagent.post(`${backendUrl}/item`)
      .set('Authorization', `Bearer ${outputJson[i][0].token}`)
      .send(itemInfo);
  
      itemList.push(itemReturn.body);
    }
    outputJson[i].push(itemList);
  }
}

async function makeRentals(rentalCount){
  if(userNum < 2) return;

  let max = outputJson.length;
  let rentalHistory = [];
  for(let x = 0; x < rentalCount; x++){
    let ownerID = null;
    let borrowerID = null;
    let itemID = null;
    let q = 0;
    do{
      ownerID = Math.floor(Math.random() * max);
      borrowerID = null;
      do{
        borrowerID = Math.floor((Math.random() * max))
      }while(ownerID === borrowerID)
      
      let itemMax = outputJson[ownerID][1].length
      itemID = Math.floor(Math.random() * itemMax);
      q++;
    }while(isPreviousRental(rentalHistory, ownerID, borrowerID, itemID) && q < 3)
   
    // console.log(ownerID, borrowerID);
    // console.log('YES!', outputJson[ownerID][0], outputJson[borrowerID][0], outputJson[ownerID][1][itemID]);
    let rentalInfo = {
      _owner:outputJson[ownerID][0]._id,
      _item:outputJson[ownerID][1][itemID]._id,
      _borrower:outputJson[borrowerID][0]._id,
    }

    // console.log(rentalInfo);
    let rentalData = await superagent.post(`${backendUrl}/rentaldoc`)
        .set('Authorization', `Bearer ${outputJson[ownerID][0].token}`)
        .send(rentalInfo);  
    rentals.push(rentalData.body);
  }

}

function isPreviousRental(array, owner, borrower, item){
  for(let i = 0; i < array.length; i++){
    if(array[i][0] === owner &&
       array[i][1] === borrower &&
       array[i][2] === item){
         return true;
      
    }
  }
  return false;
}

async function makeReviews(reviewCount){

    let reviews = [];

    let userMax = outputJson.length;
    let reviewHistory = [];
    for(let x = 0; x < reviewCount; x++){
      // console.log('for');
      let writerInd,subjectInd,type,subjectItemOwnerInd = null;
      let q = 0;

      do{
        // console.log('do1');
        writerInd = Math.floor(Math.random() * userMax);
        type = Math.floor(Math.random() * 2) === 1 ? 'user' : 'item';
        
        if(type === 'user'){
          let z = 0;
          do{
            // console.log('do2');
            subjectInd = Math.floor(Math.random() * userMax);
            subjectItemOwnerInd = Math.floor(Math.random() * userMax);
            z++;
          }while(subjectInd === writerInd || writerInd === subjectItemOwnerInd && z < 3)
        }else{
          subjectInd = Math.floor(Math.random() * outputJson[0][1].length);
          subjectItemOwnerInd = 0;
        }
        q++;
      }while(duplicateReview(reviewHistory, writerInd, subjectInd, type) && q < 3)
      
      let reviewInstance = [writerInd, subjectInd, type];
      reviewHistory.push(reviewInstance);

      console.log(subjectItemOwnerInd, outputJson[subjectItemOwnerInd]);

      let subject = type === 'user' ? outputJson[subjectInd][0]._id : outputJson[subjectItemOwnerInd][1][subjectInd]._id;
      let reviewInfo = {
        reviewSubject: subject,
        reviewWriter: outputJson[writerInd][0]._id,
        reviewType: type,
        score: Math.floor(Math.random() * 6) + 1,
        text: faker.lorem.sentences(),
      }

      let reviewData = await superagent.post(`${backendUrl}/review`)
        .set('Authorization', `Bearer ${outputJson[writerInd][0].token}`)
        .send(reviewInfo);  

      reviews.push(reviewData.body);
    }
    console.log(reviews);
}

function duplicateReview(hist, writerInd, subjectInd, type){
  for(let x = 0; x < hist.length; x++){

    if(hist[x][0] === writerInd &&
      hist[x][1] === subjectInd &&
      hist[x][2] === type)
      return true;
  }
  return false;
}

async function doTheThing(){
  await makeUsers(userNum);
  
  await makeItems(itemCount);

  await makeRentals(rentalCount);

  await makeReviews(reviewCount);
  
  console.log(outputJson);
  console.log(rentals);

}

doTheThing();

