import pgPromise from 'pg-promise';

export default pgPromise()({
  connectionString: 'postgres://comedores_comunitarios:comedores_comunitarios@localhost:5432/comedores_comunitarios',
});