{-# LANGUAGE OverloadedStrings, ExtendedDefaultRules #-}

import Data.Time.Calendar
import Data.Time.Clock
import Data.Time.LocalTime
import Data.Colour.Names
import Data.Colour
import qualified Data.List as List
import Data.Accessor
import Graphics.Rendering.Chart

import Database.MongoDB
import Control.Monad.Trans (liftIO)

-- left is latest
lastDeltas from n = rest =<< find (select ["day" Database.MongoDB.=:
                                           ["$gte" Database.MongoDB.=: from]]
                                   "deltas")
                                   {sort = ["day" Database.MongoDB.=: 1]}

known_point count
  | count > 10 = rest =<< find (select [] "meta")
                         {sort = ["time" Database.MongoDB.=: -1]}
                         {skip = 10} {limit = 1}
  | otherwise = rest =<< find (select [] "meta")
                         {sort = ["time" Database.MongoDB.=: -1]}
                         {skip = count} {limit = 1}

count_meta = count (select [] "meta")

float::Label -> Document -> Double
float field x =
  (read . show . (valueAt field)) x ::Double

-- right is latest
points::[Document] -> [(Maybe UTCTime, Double, Double)]
points docs =
  map (\doc -> (cast' $ valueAt "day" doc,
                float "+" doc,
                float "-" doc)) $ docs

date'::Int -> Int -> Int -> LocalTime
date' dd mm yyyy = (LocalTime (fromGregorian (fromIntegral yyyy) mm dd) midnight)

date::Maybe UTCTime -> LocalTime
date Nothing = date' 1 1 1970
date (Just d) = utcToLocalTime utc d

simulate'::Double -> (Maybe UTCTime, Double, Double) -> (Double, (LocalTime, Double))
simulate' money point =
  let (d,p,m) = point
  in (money+p-m, (date d, money+p-m))

simulate::Maybe Double -> [Document] -> (Double, [(LocalTime, Double)])
simulate base docs =
  List.mapAccumL simulate' (double' base) (points docs)

double'::Maybe Double -> Double
double' Nothing = 0.0
double' (Just x) = x

chart points = layout
  where
    moneys = plot_lines_style .> line_color ^= opaque blue
           $ plot_lines_values ^= [[ (d, v) | (d, v) <- points]]
           $ plot_lines_title ^= "Income"
           $ defaultPlotLines

    layout = layout1_title ^="Money History"
           $ layout1_left_axis ^: laxis_override ^= axisGridHide
           $ layout1_right_axis ^: laxis_override ^= axisGridHide
           $ layout1_bottom_axis ^: laxis_override ^= axisGridHide
           $ layout1_plots ^= [Left (toPlot moneys)]
--                               Right (toPlot expense)]
           $ layout1_grid_last ^= False
           $ defaultLayout1

known'::[Document] -> (Maybe UTCTime, Maybe Double)
known' docs = (cast' $ (valueAt "time") (docs!!0),
               cast' $ (valueAt "amount") (docs!!0))

main = do
  pipe <- runIOE $ connect (host "127.0.0.1")
  e <- access pipe master "personal-runway" run
  close pipe
  print e

run = do
  count <- count_meta
  known <- known_point (fromIntegral count-1)

  liftIO $ print count

  let from = fst $ known' known
  let money = snd $ known' known

  deltas <- lastDeltas from 30

--  liftIO $ renderableToPNGFile (toRenderable $ chart $ snd $ simulate money deltas) 640 480 "dataset/graph.png"

  liftIO $ putStrLn "done"

