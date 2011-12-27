
toshl_Y = load('../dataset/toshl.txt');
toggl_Y = load('../dataset/toggl.txt');

figure
plot(toshl_Y, "-b", toggl_Y, "-r")
axis([0 366])
ylabel('EUR');
xlabel('Days');
legend('Toshl', 'Toggl');
