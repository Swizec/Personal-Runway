
{-# LANGUAGE OverloadedStrings, ExtendedDefaultRules #-}

import Predict
import Database.MongoDB
import Control.Monad.Trans (liftIO)

main = do
  pipe <- runIOE $ connect (host "127.0.0.1")
  e <- access pipe master "personal-runway" run
  close pipe
  print e

run = do
  allMetas >>= printDocs "All Metas"

allMetas = rest =<< find (select [] "meta") {sort = ["time" =: -1]}

printDocs title docs = liftIO $ putStrLn title >> mapM_ (print . exclude ["_id"]) docs
