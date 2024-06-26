const router = require('./uploadDocAPI');
let authorizeUser = require('./AuthAPI');
const request = require('supertest');
const fs = require('fs');
let {getTokens, refreshAccessToken, updateTokens} = require('./HandleFuncs');


beforeAll((done) => {
    server = router.listen(9800, () => {
        console.log('Server 2 started listening to 5500');
        done();
    });
    
});

getTokens = jest.fn(()=>{
    [
        {
            token: 'valid token',
            expiresAt: 1714381266256,
            userDetails: {
                Fullname: 'Dhanushree A G',
                Mobile: '6361463979',
                Username: 'dhanushree_bhrish',
                Password: '$2a$12$3PxKk/sq/zltOSTBHPFKkOSvXPyoIymfZ/S2EAPz6Y8xGRQCfo6Pa',
                Role: 'Employee',
            },
            refreshToken: {
                refreshAccessToken: 'valid token',
                expiresIn: 1714985946256,
            }
        },
    ]
});

refreshAccessToken =  jest.fn(() => ({
   newAccessToken: 'newToken',
   expiresIn: Date.now() + 100000,
}));


updateTokens = jest.fn(() => 'Updated');

// Mock the authorizeUser function
authorizeUser = jest.fn((req, res, next) => {
    const token = req.headers.authorization;
    console.log('token:: ', token);
    if (!token || token === '' || token == null) {
        return res.send('Access token is required');
    }
    
    // Simulate token validation logic
    const tokenList = getTokens();
    console.log('token list: ', tokenList);
    const tokenUserFound = tokenList.find(eachToken => eachToken.token === token);
    console.log('tokenUserFound:: ',tokenUserFound);
    if (tokenUserFound) {
        console.log('inside if condn going to next');
        const currentTimestamp = Date.now();
        const ExpireTime = tokenUserFound.expiresAt;
        console.log('Expire time::', ExpireTime)
        if(currentTimestamp == ExpireTime || currentTimestamp > ExpireTime){
            const checkToken = tokenUserFound.token;
            const {newAccessToken, expiresIn} = refreshAccessToken(tokenUserFound.refreshToken);
            console.log('In Main newAccessToken::', newAccessToken);
            console.log('In Main expiresIn::', expiresIn);
            const updateNewUserToken = updateTokens(checkToken,newAccessToken, expiresIn);
            if(updateNewUserToken == "Updated"){
                console.log('Updated tokenUserFound::', tokenUserFound);
            }else{
                console.log('Else Updated tokenUserFound::', tokenUserFound);
            }

        }
        console.log('going next');
        req.token = true;
        next();
    } else {
        req.token = false;
        return res.send('Token is not valid');
    }
});

describe('POST /uploads', ()=>{
    it('Test to upload file successfully', async()=>{
        try{
        const response = await request(router)
        .post('/uploads')
        .attach('file','./abc.txt')
        .set('Authorization','h6xPitgNlK06FtsAg4biNXa7TJiDiTux')

        expect(response.text).toBe('File uploaded successfully: abc.txt');
        expect(response.statusCode).toBe(200);
        
        // Remove the uploaded file after testing
        fs.unlinkSync(`./Uploads/abc.txt`);
        } catch (error) {
            if (error.code === 'ECONNRESET') {
              console.log('Connection reset, retrying...');
            } else {
              throw error;
            }
          }
    });

    it('Test to check no file', async()=>{
        const response = await request(router)
        .post('/uploads')
        .attach()
        .set('Authorization','7ZW4An4GQMj6uo5Fwvovg805GXuqZORe')

        expect(response.text).toBe('Required the file to be uploaded');
        expect(response.statusCode).toBe(400);
    });

    it.only('Access Token missing', async()=>{
        try{
        const response = await request(router)
        .post('/uploads')
        .attach('file','./abc.txt')
        .set('Authorization','')

        console.log('Response status:', response.status);
        console.log('Response body:', response.text);

        expect(response.text).toBe('Access token is required');
        //expect(response.statusCode).toBe(401);
        } catch (error) {
            if (error.code === 'ECONNRESET') {
              console.log('Connection reset, retrying...');
            } else {
              throw error;
            }
          }
    });

    it('Test with wrong token', async()=>{
        try{
        const response = await request(router)
        .post('/uploads')
        .attach('file','./abc.txt')
        .set('Authorization','Not valid')

        expect(response.text).toBe('Token is not valid');
        }catch (error) {
            if (error.code === 'ECONNRESET') {
              console.log('Connection reset, retrying...');
            } else {
              throw error;
            }
          }
    });

    it('Test token expired', async()=>{
        try{
        const response = await request(router)
        .post('/uploads')
        .attach('file','./abc.txt')
        .set('Authorization','expired')

        expect(response.text).toBe('Token is expired');
        } catch (error) {
            if (error.code === 'ECONNRESET') {
              console.log('Connection reset, retrying...');
            } else {
              throw error;
            }
          }
    });


});

afterAll((done) => {
    server.close((err) => {
        if (err) {
            console.error(err);
            return done(err);
        }
        console.log('Server closed');
    });
    // server2.close((err) => {
    //     if (err) {
    //         console.error(err);
    //         return done(err);
    //     }
    //     console.log('Server 2 closed');
    // });
    done();
});