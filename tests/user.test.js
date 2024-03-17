const it = require("ava").default;
const chai = require("chai");
var expect = chai.expect;

const startDB = require('../helpers/DB');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { addUser } = require('../index');
const { getAllUsers } = require('../index');
const { getSingleUser } = require('../index');
const { deleteUser } = require('../index');

const User = require('../models/user');
const sinon = require("sinon");
const utils = require('../helpers/utils')

it.before(async (t)=>{
    t.context.mongod = await MongoMemoryServer.create();
    process.env.MONGOURI = t.context.mongod.getUri('cloudUnitTesting');
    await startDB();
}

);

it.after(async (t)=>{
 await t.context.mongod.stop({doCleanUp: true});
})

it("create user succesfully", async (t) => {
  // setup
  const request = {
    body: {
      firstName: "Doaa",
      lastName: "Darwish",
      age: 22,
      job: "Student",
    },
  };
  const expectedResult = {
    fullName: "Doaa Darwish",
    age: 22,
    job: "Student",
  };

  sinon.stub(utils, 'getFullName').callsFake((fname, lname)=>{
    expect(fname).to.be.equal(request.body.firstName);
    expect(lname).to.be.equal(request.body.lastName);
    return 'Doaa Darwish'
  })
  const actualResult = await addUser(request);
  const result = {
    ...expectedResult,
    __v: actualResult.__v,
    _id: actualResult._id
  }
  expect(actualResult).to.be.a('object');
  expect(actualResult._doc).to.deep.equal(result);
  //register the function to run after the test has finished
  t.teardown(async ()=>{
    await User.deleteMany({
        fullName: request.body.fullName,
    })
  })
  t.pass();
});


// getusers
// getSingleUser
// deleteUser

it("get users successfully", async (t) => {
  // setup
  const users = [
      { fullName: "Doaa Darwish1", age: 22, job: "Engineer" },
      { fullName: "Doaa Darwish2", age: 22, job: "Student" }
  ];
  await User.insertMany(users);

  // test/verifying
  const fetchedUsers = await getAllUsers();
  expect(fetchedUsers).to.be.an('array');

  expect(fetchedUsers[0].fullName).to.equal(users[0].fullName);
  expect(fetchedUsers[0].age).to.equal(users[0].age);
  expect(fetchedUsers[0].job).to.equal(users[0].job);

  expect(fetchedUsers[1].fullName).to.equal(users[1].fullName);
  expect(fetchedUsers[1].age).to.equal(users[1].age);
  expect(fetchedUsers[1].job).to.equal(users[1].job);

  t.teardown(async () => {
      await User.deleteMany({}); 
  });

  t.pass(); 
});

it("get single user successfully", async (t) => {
  // setup
  const user = { fullName: "Doaa Darwisg", age: 22, job: "Student" };
  const newUser = await User.create(user);

  // test
  const fetchedUser = await getSingleUser({ params: { id: newUser._id } }); 
  expect(fetchedUser).to.be.an('object');
  expect(fetchedUser).to.include(user);

  t.teardown(async () => {
      await User.deleteMany({});
  });

  t.pass();
});

it("delete user successfully", async (t) => {
  // setup
  const body = { fullName: "Doaa Darwish", age: 22, job: "Student" };
  const newUser = await User.create(body);

  // test
  await deleteUser({ params: { id: newUser._id } }); 
  const fetchedUser = await User.findById(newUser._id);
  expect(fetchedUser).to.be.null;
  t.pass();
});

// bonus : validation, updateUser