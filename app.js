const express = require('express')

const app = express()

const {open} = require('sqlite')

const sqlite3 = require('sqlite3')

const path = require('path')

const dbPath = path.join(__dirname, 'covid19India.db')

app.use(express.json())

let database = null

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Success....')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertStatesDbDataIntoResponse = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictObjects = databaseObject => {
  return {
    districtId: databaseObject.district_id,
    districtName: databaseObject.district_name,
    stateId: databaseObject.state_id,
    cases: databaseObject.cases,
    cured: databaseObject.cured,
    active: databaseObject.active,
    deaths: databaseObject.deaths,
  }
}

//API 1

app.get('/states/', async (request, response) => {
  const getStatesQuery = `SELECT * FROM state`

  const statesArray = await database.all(getStatesQuery)

  response.send(
    statesArray.map(eachState => convertStatesDbDataIntoResponse(eachState)),
  )
})

//API 2
app.get('/states/:stateId/', async (request, response) => {
  let {stateId} = request.params

  const getStateQuery = `SELECT * FROM state WHERE state_id=${stateId}`

  const state = await database.get(getStateQuery)

  response.send(convertStatesDbDataIntoResponse(state))
})

//API 3
app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails

  const adddistrictQuery = `
     INSERT INTO district (district_name,state_id,cases,cured,active,deaths) 
     VALUES('${districtName}',
             ${stateId},
             ${cases},
             ${cured},
             ${active},
             ${deaths});
  `

  await database.run(adddistrictQuery)

  response.send('District Successfully Added')
})

//API 4
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params

  const query = `SELECT * FROM district WHERE district_id=${districtId}`

  const district = await database.get(query)

  response.send(convertDistrictObjects(district))
})

//API 5
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params

  const query = `DELETE FROM district WHERE district_id=${districtId}`

  await database.run(query)

  response.send('District Removed')
})

//API 6

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params

  const districtDetails = request.body

  const {districtName, stateId, cases, cured, active, deaths} = districtDetails

  const query = `
    UPDATE 
        district 
    SET 
      district_name ='${districtName}',

      state_id =${stateId},

      cases = ${cases},

      cured = ${cured},

      active = ${active},

      deaths = ${deaths}

      WHERE district_id=${districtId};
  `
  await database.run(query)
  response.send('District Details Updated')
})

//API 7
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params

  const query = `
  SELECT 
     
     sum(cases) as totalCases,
     sum(cured) as totalCured,
     sum(active) as totalActive,
     sum(deaths) as totalDeaths

     FROM 

     district 

     WHERE state_id=${stateId};

  `
  const state = await database.get(query)
  response.send(state)
})

//API 8

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params

  const query = `
       SELECT 
       state_name as stateName 
       FROM state 
       INNER JOIN 
       district
        ON state.state_id=district.state_id 
        WHERE district.district_id=${districtId}
  `
  const result = await database.get(query)


  response.send(result)
})

module.exports = app
