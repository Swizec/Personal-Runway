{-# LANGUAGE OverloadedStrings, ExtendedDefaultRules #-}

import Data.Time.Calendar
import Data.Time.Clock
import Data.Time.LocalTime
import Data.Colour.Names
import Data.Colour
import Data.Accessor
import Graphics.Rendering.Chart

import Database.MongoDB
import Control.Monad.Trans (liftIO)

--import Prices

--date::Int -> Int -> Int -> LocalTime
--date dd mm yyyy = (LocalTime (fromGregorian (fromIntegral yyyy) mm dd) midnight)
--ok y = (y == 2005) || (y == 2006)

--chart = layout
--  where

--    price1 = plot_lines_style .> line_color ^= opaque blue
--           $ plot_lines_values ^= [[ (d, v) | (d,v,_) <- prices1]]
--           $ plot_lines_title ^= "price 1"
--           $ defaultPlotLines

--    price2 = plot_lines_style .> line_color ^= opaque green
--           $ plot_lines_values ^= [[ (d, v) | (d,v,_) <- prices2]]
--           $ plot_lines_title ^= "price 2"
--           $ defaultPlotLines

--    layout = layout1_title ^="Price History"
--           $ layout1_left_axis ^: laxis_override ^= axisGridHide
--           $ layout1_right_axis ^: laxis_override ^= axisGridHide
--           $ layout1_bottom_axis ^: laxis_override ^= axisGridHide
--           $ layout1_plots ^= [Left (toPlot price1),
--                               Right (toPlot price2)]
--           $ layout1_grid_last ^= False
--           $ defaultLayout1

import Database.MongoDB
import Control.Monad.Trans (liftIO)
import System.Environment

lastDeltas n = rest =<< find (select [] "deltas") {sort = ["day" Database.MongoDB.=: 1]} {limit = n}

series field docs = map ((\x -> read x::Float) . show . (valueAt field))
                         docs

float::Label -> Document -> Float
float field x =
  (read . show . (valueAt field)) x ::Float

points::[Document] -> [(Maybe UTCTime, Float, Float)]
points docs =
  map (\doc -> (cast' $ valueAt "day" doc, float "+" doc, float "-" doc)) docs



main = do
  args <- getArgs
  pipe <- runIOE $ connect (host "127.0.0.1")
  e <- access pipe master "personal-runway" (run (read (args!!0)::Float))
  close pipe
  print e

run current  = do
  deltas <- lastDeltas 30

  --let points = zip (series "+" deltas) (series "-" deltas)

  liftIO $ putStrLn $ show $ points deltas


simulate money toggl toshl =
  foldl (\acc (plus, minus) -> acc+plus-minus) money $ zip toggl toshl
