
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
  -- left is latest
  deltas <- lastDeltas 30

  let toggl = predict 14 $ reverse $ floatify (series "+" deltas)
  let toshl = predict 14 $ reverse $ floatify (series "-" deltas)

  -- last 14 are predictions

lastDeltas n = rest =<< find (select [] "deltas") {sort = ["day" =: -1]} {limit = n}

printDocs title docs = liftIO $ putStrLn title >> mapM_ (print . exclude ["_id"]) docs

series field docs = map (valueAt field) docs

floatify xs = map (\x -> read x::Float) $ map show xs
