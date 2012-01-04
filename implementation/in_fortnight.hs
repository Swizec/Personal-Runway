
{-# LANGUAGE OverloadedStrings, ExtendedDefaultRules #-}

import Predict
import Database.MongoDB
import Control.Monad.Trans (liftIO)
import System.Environment

main = do
  args <- getArgs
  pipe <- runIOE $ connect (host "127.0.0.1")
  e <- access pipe master "personal-runway" (run (read (args!!0)::Float))
  close pipe
  print e

run money = do
  -- left is latest
  deltas <- lastDeltas 30

  let toggl = last14 $ predict 14 $ reverse $ floatify (series "+" deltas)
  let toshl = last14 $ predict 14 $ reverse $ floatify (series "-" deltas)

  liftIO $ putStrLn $ show (simulate money toggl toshl)

lastDeltas n = rest =<< find (select [] "deltas") {sort = ["day" =: -1]} {limit = n}

series field docs = map (valueAt field) docs

floatify xs = map (\x -> read x::Float) $ map show xs

-- left is earliest
last14 xs = reverse $ take 14 $ reverse xs

simulate money toggl toshl =
  foldl (\acc (plus, minus) -> acc+plus-minus) money $ zip toggl toshl
