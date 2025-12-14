#include <stdio.h>
#include <string.h>
#include "../include/process.h"
#include "../include/colors.h"

void fifo(Process p[], int n) {
    int waiting[n], turnaround[n];

    for(int i = 0; i < n-1; i++) {
        for(int j = i+1; j < n; j++) {
            if(p[i].arrival > p[j].arrival) {
                Process tmp = p[i];
                p[i] = p[j];
                p[j] = tmp;
            }
        }
    }

    int total_time = 0;
    for(int i = 0; i < n; i++) {
        if(total_time < p[i].arrival)
            total_time = p[i].arrival;
        total_time += p[i].burst;
    }

    for(int i = 0; i < n; i++) {
        waiting[i] = 0;
        turnaround[i] = 0;
    }

    printf("\n================ FIFO Scheduler =================\n");

    printf("%-5s %-10s %-8s %-6s\n", "ID", "Process", "Arrival", "Burst");
    printf("-----------------------------------------------\n");
    for(int i = 0; i < n; i++) {
        printf("%-5d %-10s %-8d %-6d\n", i+1, p[i].name, p[i].arrival, p[i].burst);
    }

    printf("\nGantt Chart:\n");

    printf("Time : ");
    for(int t = 0; t < total_time; t++)
        printf("%2d ", t);
    printf("\n");

    int gantt_time = 0;
    for(int i = 0; i < n; i++) {
        printf("%-6s: ", p[i].name);

        for(int t = 0; t < total_time; t++) {
            if(t >= gantt_time && t < gantt_time + p[i].burst) {
                printf("%s█%s ", colors[i % 6], RESET);
            } else {
                printf(" . ");
            }
        }
        printf("\n");

        if(gantt_time < p[i].arrival)
            gantt_time = p[i].arrival;
        gantt_time += p[i].burst;

        waiting[i] = gantt_time - p[i].arrival - p[i].burst;
        turnaround[i] = gantt_time - p[i].arrival;
    }

    printf("\nSummary:\n");
    printf("%-10s %-10s %-10s\n", "Process", "Waiting", "Turnaround");
    for(int i = 0; i < n; i++) {
        printf("%-10s %-10d %-10d\n", p[i].name, waiting[i], turnaround[i]);
    }

    printf("================================================\n");
    printf("End of FIFO scheduling.\n\n");
}