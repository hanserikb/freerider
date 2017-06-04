const express         =   require('express');
const freeriderParser =   require('./freerider-scraper');
const cors            =   require('cors');
const app = express();
app.use(cors());
app.get('/', (req, res) => {
  freeriderParser((error, result) => {
    if(error) {
      res.status(500).json(error);
    } else {
      res.json(result);
    }
  });
});

app.listen(3001);
