import minimist from 'minimist';
import app from './app';

const argv = minimist(process.argv.slice(2));
const port = parseInt(process.env.PORT || argv.port || 3004, 10);

app.listen(port, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Listening: http://localhost:${port}`);
});
