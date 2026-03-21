#include <stdio.h>

void process_data(int data) {
    printf("Processing: %d\n", data);
}

void main_logic() {
    int x = 10;
    process_data(x);
}

int main() {
    main_logic();
    return 0;
}
