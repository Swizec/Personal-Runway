
function J = linearCost(X, y, Theta)

m = length(y);

J = (1/(2*m))*sum(((X*Theta)-y).^2);

end
