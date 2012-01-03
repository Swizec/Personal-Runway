
toshl_Y = load('../dataset/toshl.txt');
toggl_Y = load('../dataset/toggl.txt');

m = length(toshl_Y);
theta = zeros(2,1);

window = 3;
averaged = filter(ones(window,1)/window, 1, toggl_Y);
averaged = filter(ones(window,1)/window, 1, averaged);

size(toshl_Y)
size(toggl_Y)

toggl_P = load("../dataset/toggl_predict.txt");
toshl_P = load("../dataset/toshl_predict.txt");

plot(toggl_Y, '-b', toshl_Y, '-r', toggl_P, '-g', toshl_P, '-m')
axis([300 396])

%X = [ones(m,1), (1:1:m)'];

%theta = gradientDescent(X, averaged2, theta, 0.01, 100);

%plot(X(:,2), X*theta, '-y')
