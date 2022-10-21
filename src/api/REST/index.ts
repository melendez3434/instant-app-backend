const router = (express) => {
  express.get('/rest', async (req, res) => {
    res.send('welcome again')
  })
}

export default router
